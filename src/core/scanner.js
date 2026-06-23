'use strict';

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { ExchangeClient } = require('./exchange');
const { computeIndicators, scoreSignal } = require('./indicators');
const { AIEngine } = require('./ai');
const { Brain, regimeFromCandidate } = require('./brain');
const { Journal } = require('./journal');
const { MarketData } = require('./marketdata');
const { computeConfluence, formatConfluence } = require('./confluence');

function loadConfig() {
  const p = path.join(__dirname, '../../config.json');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

/**
 * Mapea items -> fn(item) con un tope de concurrencia. Acelera el I/O de red
 * (descargas) sin disparar todas las llamadas a la vez.
 */
async function pMap(items, fn, concurrency = 6) {
  const ret = new Array(items.length);
  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const cur = idx++;
      ret[cur] = await fn(items[cur], cur);
    }
  }
  const n = Math.max(1, Math.min(concurrency, items.length));
  await Promise.all(Array.from({ length: n }, worker));
  return ret;
}

/**
 * Etapa 1+2 del embudo: calcula indicadores locales sobre todos los símbolos
 * y devuelve la lista RANKEADA por fuerza de confluencia (|score| desc).
 * Las descargas OHLCV corren EN PARALELO (timeframes por símbolo + símbolos
 * concurrentes) para no ir una tras otra.
 */
async function rankSymbols(config, ex, symbols, { onProgress = () => {}, errors = [] } = {}) {
  const tfs = config.timeframes;
  const limit = config.candles_limit || 200;
  const concurrency = config.scan_concurrency || 6;
  let done = 0;

  const results = await pMap(
    symbols,
    async (symbol) => {
      try {
        // Los timeframes del mismo símbolo se descargan a la vez.
        const ohlcvs = await Promise.all(tfs.map((tf) => ex.fetchOHLCV(symbol, tf, limit)));
        const byTimeframe = {};
        let aggScore = 0;
        let price = null;
        tfs.forEach((tf, k) => {
          const ind = computeIndicators(ohlcvs[k]);
          if (!ind) return;
          const sc = scoreSignal(ind);
          const weight = tf.includes('m') ? 0.8 : 1.2;
          aggScore += sc.score * weight;
          price = ind.price;
          byTimeframe[tf] = {
            price: round(ind.price),
            rsi: round(ind.rsi),
            ema20: round(ind.ema20),
            ema50: round(ind.ema50),
            ema200: round(ind.ema200),
            macdHist: round(ind.macdHist, 6),
            adx: round(ind.adx),
            atr: round(ind.atr, 6),
            bias: sc.bias,
            score: round(sc.score),
            reasons: sc.reasons,
          };
        });
        onProgress('indicators', { symbol, i: ++done, total: symbols.length });
        if (price == null) return null;
        return {
          symbol,
          price,
          score: aggScore,
          bias: aggScore > 0 ? 'long' : aggScore < 0 ? 'short' : 'neutral',
          byTimeframe,
        };
      } catch (e) {
        errors.push({ symbol, error: e.message });
        onProgress('indicators', { symbol, i: ++done, total: symbols.length });
        return null;
      }
    },
    concurrency
  );

  const ranked = results.filter(Boolean);
  ranked.sort((a, b) => Math.abs(b.score) - Math.abs(a.score));
  return ranked;
}

/**
 * Ejecuta un escaneo completo.
 * onProgress(stage, info) permite a la UI mostrar avance.
 * Devuelve { signals: [...], scanned, candidates, errors }
 */
async function runScan(config, { onProgress = () => {} } = {}) {
  const ex = new ExchangeClient(config);
  const ai = new AIEngine(config, process.env.OPENROUTER_API_KEY);

  onProgress('resolving', {});
  const symbols = await ex.resolveSymbols();
  onProgress('symbols', { count: symbols.length });

  const errors = [];

  // --- Etapa 1+2: indicadores locales + ranking ---
  const ranked = await rankSymbols(config, ex, symbols, { onProgress, errors });

  // --- Filtrar candidatas ---
  // Mejora del backtest: exigir ADX mínimo (tendencia real) sube el WR.
  const minScore = config.funnel.min_local_score;
  const maxCand = config.funnel.max_ai_candidates;
  const minAdx = config.funnel.min_adx || 0;
  const lastTfKey = lastTf(config);
  const candidates = ranked
    .filter((r) => Math.abs(r.score) >= minScore)
    .filter((r) => {
      if (!minAdx) return true;
      const adx = r.byTimeframe?.[lastTfKey]?.adx;
      return adx == null || adx >= minAdx;
    })
    .slice(0, maxCand);

  onProgress('candidates', { count: candidates.length });

  // --- Cerebro + diario ---
  const brain = new Brain(config).load();
  const journal = new Journal(config);
  const historyContext = journal.statsContext();
  const limit = journal.dailyLimitHit(config);
  if (limit.hit) {
    onProgress('halt', { reason: limit.reason });
    return { signals: [], scanned: ranked.length, candidates: 0, errors, halted: limit.reason };
  }

  // --- Datos de mercado en vivo (global + por símbolo, todo en PARALELO) ---
  const market = config.marketdata?.enabled !== false ? new MarketData(config) : null;
  const symCtxBySymbol = {};
  if (market) {
    onProgress('market', {});
    const [globalCtx] = await Promise.all([
      market.globalContext().catch((e) => {
        errors.push({ stage: 'marketdata', error: e.message });
        return null;
      }),
      pMap(
        candidates,
        async (c) => {
          try {
            symCtxBySymbol[c.symbol] = await market.symbolContext(c.symbol);
          } catch (e) {
            errors.push({ symbol: c.symbol, error: `marketdata: ${e.message}` });
          }
        },
        config.scan_concurrency || 6
      ),
    ]);
    market._globalCtx = globalCtx;
  }

  // --- Etapa 3: la IA decide (cerebro + datos de mercado inyectados) ---
  // Varias candidatas en paralelo (tope moderado para no saturar modelos gratis).
  let aiDone = 0;
  const evaluated = []; // TODA candidata evaluada para el digest diario (resiliente a caídas de IA).
  const decided = await pMap(
    candidates,
    async (c) => {
      const regime = regimeFromCandidate(c);
      const symCtx = symCtxBySymbol[c.symbol] || {};
      const conf = computeConfluence(c, symCtx, market ? market._globalCtx : {});
      // Idea BASE mecánica (entrada/SL/TP por ATR) SIEMPRE, antes de llamar a la IA.
      // Así, aunque los modelos gratis fallen o digan NONE, la idea con niveles existe.
      const baseDir = conf.dominant || c.bias;
      const baseConfluence = baseDir === conf.dominant ? conf.count : 0;
      const mech = mechanicalPlan(c, baseDir, config);
      const ev = {
        symbol: c.symbol,
        dir: baseDir,
        hasPlan: false,
        confluence: baseConfluence,
        localScore: round(c.score),
        confidence: 0,
        entry: mech?.entry ?? null,
        stop: mech?.stop ?? null,
        target: mech?.target ?? null,
        rr: mech?.rr ?? null,
        orderType: 'market',
        setup: 'mecánico-nivel',
        vp: symCtx.volumeProfile || null,
      };
      evaluated.push(ev);
      try {
        const brainContext = brain.contextFor({ bias: c.bias, regime, timeframe: lastTf(config) });
        const marketContext = market ? market.formatContext(market._globalCtx, symCtx) : '';
        const confluenceContext = formatConfluence(conf);
        const decision = await ai.decide(c, { brainContext, historyContext, marketContext, confluenceContext });
        onProgress('ai', { symbol: c.symbol, i: ++aiDone, total: candidates.length });
        if (decision.action && decision.action !== 'none') {
          // La IA aprobó un plan: SUBE la idea base a "con plan" (grado A+/A/B).
          const dir = decision.action;
          const confluence = dir === conf.dominant ? conf.count : 0;
          Object.assign(ev, {
            dir,
            hasPlan: true,
            confluence,
            confidence: decision.confidence,
            entry: decision.entry ?? ev.entry,
            stop: decision.stop ?? ev.stop,
            target: decision.target ?? ev.target,
            rr: computeRR(decision) ?? ev.rr,
            orderType: decision.orderType || 'market',
            setup: decision.setup || '',
          });
          // NO se registra automáticamente: solo se guarda cuando el usuario
          // pulsa "Tomado" en la app (scripts/journal-add.js).
          return {
            symbol: c.symbol,
            ...decision,
            regime,
            localScore: round(c.score),
            confluence,
            confluenceFactors: dir === conf.dominant ? conf.factors.map((f) => f.name) : [],
            rr: computeRR(decision),
            ts: nowISO(),
          };
        }
        return null; // IA dijo NONE → la idea base mecánica queda como "vigilar" (C)
      } catch (e) {
        errors.push({ symbol: c.symbol, error: e.message });
        onProgress('ai', { symbol: c.symbol, i: ++aiDone, total: candidates.length });
        return null;
      }
    },
    config.ai_concurrency || 3
  );

  let signals = decided.filter(Boolean);
  signals.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
  // Guardia de riesgo 1: R:R minimo 2 (regla del cerebro, aplicada tambien en codigo).
  signals = signals.filter((s) => {
    if (s.rr != null && s.rr < 1.95) {
      errors.push({ symbol: s.symbol, error: 'descartada: R:R ' + s.rr + ' < 2 (regla rr-minimo)' });
      return false;
    }
    return true;
  });
  // Guardia de riesgo 2: tope por direccion — varios trades en la misma direccion en alts
  // correlacionadas son UNA sola apuesta (leccion del diario 2026-06-12: -4R en un cluster).
  const maxPerDir = config.funnel.max_signals_per_direction ?? 2;
  const perDir = { long: 0, short: 0 };
  signals = signals.filter((s) => {
    perDir[s.action] = (perDir[s.action] || 0) + 1;
    if (perDir[s.action] > maxPerDir) {
      errors.push({ symbol: s.symbol, error: 'descartada: tope de ' + maxPerDir + ' senales ' + s.action + ' por escaneo (correlacion)' });
      return false;
    }
    return true;
  });
  onProgress('done', { signals: signals.length });

  // --- Ideas del día: las mejores oportunidades graduadas (objetivo ~N/día) ---
  // Honesto: NO fuerza trades A+ que no existen. Surfacea las mejores que HAY,
  // con nota de calidad. A+/A/B tienen plan; C es "vigilar" (la IA dijo NONE).
  const gradeOf = (e) => {
    if (e.hasPlan) return e.confluence >= 4 ? 'A+' : e.confluence >= 2 ? 'A' : 'B';
    return 'C';
  };
  const targetN = config.funnel?.daily_target_signals || 4;
  const byRank = (a, b) => b.confluence - a.confluence || Math.abs(b.localScore) - Math.abs(a.localScore);
  // Con plan de la IA (A+/A/B) — se mandan TODAS (mínimo N, pero puede ser MÁS).
  const withPlan = evaluated.filter((e) => e.hasPlan).map((e) => ({ ...e, grade: gradeOf(e) })).sort(byRank);
  // Sin plan (IA dijo NONE) pero con plan mecánico válido → "vigilar" (grado C).
  const noPlan = evaluated.filter((e) => !e.hasPlan && e.entry != null).map((e) => ({ ...e, grade: 'C' })).sort(byRank);
  const ideas = withPlan.slice();
  for (const e of noPlan) {
    if (ideas.length >= targetN) break; // completa hasta el mínimo con las mejores "vigilar"
    ideas.push(e);
  }

  return { signals, ideas, scanned: ranked.length, candidates: candidates.length, errors };
}

function lastTf(config) {
  const tfs = config.timeframes || [];
  return tfs[tfs.length - 1] || 'any';
}

function computeRR(d) {
  if (!d.entry || !d.stop || !d.target) return null;
  const risk = Math.abs(d.entry - d.stop);
  const reward = Math.abs(d.target - d.entry);
  if (risk === 0) return null;
  return round(reward / risk, 2);
}

/**
 * Plan mecánico para ideas "vigilar" (cuando la IA no da plan): entrada al precio,
 * stop a N×ATR y target a R:R. Sirve para mostrar niveles y guardarlos para feedback.
 */
function mechanicalPlan(c, dir, config) {
  if (!dir || dir === 'neutral') return null;
  const tf = lastTf(config);
  const atr = c.byTimeframe?.[tf]?.atr;
  const price = c.price;
  if (!price || !atr) return null;
  const rr = config.risk?.default_rr || 2;
  const mult = config.risk?.atr_stop_mult || 2;
  // Tope de stop al 8% del precio: en low-caps muy volátiles 2×ATR(4h) da niveles
  // absurdos (target casi a cero). El cap mantiene entrada/SL/TP realistas.
  const risk = Math.min(mult * atr, price * 0.08);
  const long = dir === 'long';
  return {
    entry: round(price, 6),
    stop: round(long ? price - risk : price + risk, 6),
    target: round(long ? price + rr * risk : price - rr * risk, 6),
    rr,
  };
}

function round(v, dp = 2) {
  if (v == null || Number.isNaN(v)) return null;
  const f = Math.pow(10, dp);
  return Math.round(v * f) / f;
}

// new Date() sin args no está disponible en algunos entornos; usamos Date con timestamp.
function nowISO() {
  try {
    return new Date(Date.now()).toISOString();
  } catch {
    return '';
  }
}

module.exports = { runScan, rankSymbols, loadConfig, round };

// Permite correr directamente: `npm run scan` o `node scanner.js --json` (para la app Swift)
if (require.main === module) {
  const jsonMode = process.argv.includes('--json');
  // En modo JSON, todo el progreso va a stderr; stdout queda limpio para el JSON final.
  const log = jsonMode ? (...a) => console.error(...a) : (...a) => console.log(...a);
  (async () => {
    const config = loadConfig();
    log('Escaneando... (esto puede tardar según nº de monedas y timeframes)\n');
    const res = await runScan(config, {
      onProgress: (stage, info) => {
        if (stage === 'symbols') log(`Símbolos a escanear: ${info.count}`);
        if (stage === 'indicators' && info.i % 10 === 0)
          log(`  indicadores ${info.i}/${info.total}`);
        if (stage === 'candidates') log(`Candidatas para IA: ${info.count}`);
        if (stage === 'ai') log(`  IA analizando ${info.symbol} (${info.i}/${info.total})`);
      },
    });

    if (jsonMode) {
      // Salida única y limpia para la app Swift.
      process.stdout.write(JSON.stringify(res));
      return;
    }

    console.log('\n=== SEÑALES ===');
    if (res.signals.length === 0) console.log('Sin señales de alta probabilidad ahora mismo.');
    for (const s of res.signals) {
      console.log(
        `\n${s.action.toUpperCase()} ${s.symbol}  [conf ${s.confidence}%, ${s.style}, ${s.timeframe}]\n` +
          `  entrada ${s.entry} | stop ${s.stop} | target ${s.target} | R:R ${s.rr}\n` +
          `  ${s.rationale}`
      );
    }
    if (res.errors.length) console.log(`\n(${res.errors.length} errores omitidos)`);
  })().catch((e) => {
    if (process.argv.includes('--json')) {
      process.stdout.write(JSON.stringify({ signals: [], error: e.message }));
      process.exit(0);
    }
    console.error('Error fatal:', e.message);
    process.exit(1);
  });
}

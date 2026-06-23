'use strict';

/**
 * Backtest DEMO del motor mecánico (sin IA): recorre datos históricos, abre trades
 * cuando la confluencia de indicadores supera un umbral, pone stop por ATR (1.5×) y
 * target a 2R, y simula hacia adelante si tocó stop (pérdida) o target (ganancia).
 *
 * Además analiza los trades PERDIDOS para extraer lecciones y las escribe en el
 * cerebro (00-principios/lecciones-aprendidas.md) para que el bot APRENDA de ellas.
 *
 * Uso: npm run backtest   (o: node src/core/backtest.js [TF] [velas])
 */

const path = require('path');
const fs = require('fs');
const os = require('os');

const { ExchangeClient } = require('./exchange');
const { computeIndicators, scoreSignal } = require('./indicators');
const { loadConfig } = require('./scanner');

const RR = 2; // target a 2R
const ATR_MULT = 1.5; // stop a 1.5×ATR
const MIN_SCORE = 2.5; // umbral de confluencia para abrir (selectivo)
const WARMUP = 210; // velas necesarias para EMA200 + margen
const MAX_HOLD = 48; // velas máximas en posición antes de cerrar por tiempo

function expandHome(p) {
  return p.startsWith('~') ? path.join(os.homedir(), p.slice(1)) : p;
}

/** Simula los trades de un símbolo sobre su serie OHLCV. */
function backtestSymbol(symbol, o, opts = {}) {
  const minScore = opts.minScore ?? MIN_SCORE;
  const minAdx = opts.minAdx ?? 0;
  const withTrendOnly = opts.withTrendOnly ?? false;
  const rr = opts.rr ?? RR;
  const trades = [];
  let pos = null;
  const n = o.close.length;

  for (let i = WARMUP; i < n; i++) {
    if (pos) {
      // ¿Tocó stop o target en la vela i?
      const hi = o.high[i];
      const lo = o.low[i];
      const long = pos.dir === 'long';
      const hitStop = long ? lo <= pos.stop : hi >= pos.stop;
      const hitTarget = long ? hi >= pos.target : lo <= pos.target;

      let closed = null;
      if (hitStop && hitTarget) closed = { result: 'loss', r: -1 }; // conservador: stop primero
      else if (hitStop) closed = { result: 'loss', r: -1 };
      else if (hitTarget) closed = { result: 'win', r: rr };
      else if (i - pos.openBar >= MAX_HOLD) {
        const move = long ? o.close[i] - pos.entry : pos.entry - o.close[i];
        const r = move / pos.risk;
        closed = { result: 'timeout', r: round(r, 2) };
      }

      if (closed) {
        trades.push({ ...pos, ...closed, closeBar: i });
        pos = null;
      }
      continue;
    }

    // Sin posición: ¿hay señal?
    const slice = {
      time: o.time.slice(0, i + 1),
      open: o.open.slice(0, i + 1),
      high: o.high.slice(0, i + 1),
      low: o.low.slice(0, i + 1),
      close: o.close.slice(0, i + 1),
      volume: o.volume.slice(0, i + 1),
    };
    const ind = computeIndicators(slice);
    if (!ind || !ind.atr) continue;
    const sc = scoreSignal(ind);
    if (Math.abs(sc.score) < minScore) continue;

    const dir = sc.score > 0 ? 'long' : 'short';
    // --- Filtros de mejora ---
    if (minAdx && (ind.adx || 0) < minAdx) continue; // exige tendencia real
    const counterTrend = dir === 'long' ? ind.price < ind.ema200 : ind.price > ind.ema200;
    if (withTrendOnly && counterTrend) continue; // solo a favor de la EMA200

    const entry = ind.price;
    const risk = ATR_MULT * ind.atr;
    const stop = dir === 'long' ? entry - risk : entry + risk;
    const target = dir === 'long' ? entry + rr * risk : entry - rr * risk;

    pos = {
      symbol,
      dir,
      entry: round(entry, 6),
      stop: round(stop, 6),
      target: round(target, 6),
      risk,
      openBar: i,
      // features para analizar pérdidas
      rsi: round(ind.rsi),
      adx: round(ind.adx),
      regime:
        ind.adx > 25 && aligned(ind) ? 'trending' : ind.adx < 20 ? 'ranging' : 'mixed',
      counterTrend: dir === 'long' ? ind.price < ind.ema200 : ind.price > ind.ema200,
    };
  }
  return trades;
}

function aligned(ind) {
  return (
    (ind.ema20 > ind.ema50 && ind.ema50 > ind.ema200) ||
    (ind.ema20 < ind.ema50 && ind.ema50 < ind.ema200)
  );
}

/** Asigna la causa raíz de UN trade perdido a partir de sus features. */
function rootCause(t) {
  if (t.result === 'timeout') return 'Sin momentum (cerró por tiempo, la idea no tenía fuerza)';
  if (t.counterTrend) return 'Contra tendencia (operó del lado opuesto a la EMA200)';
  if (t.regime === 'ranging' || t.regime === 'mixed')
    return 'Sin tendencia clara (ADX débil: el setup necesitaba más confluencia)';
  if (t.dir === 'short' && t.rsi < 30) return 'Short en sobreventa extrema (entró tarde en la caída)';
  if (t.dir === 'long' && t.rsi > 70) return 'Long en sobrecompra extrema (persiguió la subida)';
  return 'Entrada/contexto a revisar (sin patrón único evidente)';
}

/** Analiza los trades PERDIDOS: deriva lecciones y la causa raíz de cada error. */
function deriveLessons(trades) {
  const losers = trades.filter((t) => t.r < 0);

  // Análisis de causa raíz de CADA error (agrupado).
  const causeCounts = {};
  for (const t of losers) {
    const c = rootCause(t);
    causeCounts[c] = (causeCounts[c] || 0) + 1;
  }
  const causes = Object.entries(causeCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([cause, count]) => ({ cause, count }));

  const lessons = [];
  const bucket = (name, pred) => {
    const all = trades.filter(pred);
    const lost = all.filter((t) => t.r < 0);
    if (all.length >= 5 && lost.length / all.length >= 0.6) {
      lessons.push(
        `${name}: perdieron ${lost.length} de ${all.length} (${pct(lost.length / all.length)} de pérdida). Evítalo o exige más confluencia.`
      );
    }
  };

  bucket('Entradas SHORT con RSI < 30 (sobreventa)', (t) => t.dir === 'short' && t.rsi < 30);
  bucket('Entradas LONG con RSI > 70 (sobrecompra)', (t) => t.dir === 'long' && t.rsi > 70);
  bucket('Entradas contra-tendencia (vs EMA200)', (t) => t.counterTrend);
  bucket('Entradas en rango (ADX < 20)', (t) => t.regime === 'ranging');
  bucket('Entradas con ADX débil/mixto', (t) => t.regime === 'mixed');
  bucket('Trades cerrados por tiempo (sin momentum)', (t) => t.result === 'timeout');

  // Peor dirección
  for (const d of ['long', 'short']) {
    const all = trades.filter((t) => t.dir === d);
    const lost = all.filter((t) => t.r < 0);
    if (all.length >= 8 && lost.length / all.length >= 0.6)
      lessons.push(
        `Dirección ${d.toUpperCase()}: WR bajo (${pct(1 - lost.length / all.length)}). Revisa si el contexto de mercado la favorece antes de tomarla.`
      );
  }

  if (!lessons.length)
    lessons.push('Sin patrones de pérdida claros en esta muestra; mantén la disciplina del plan.');
  return { losers: losers.length, lessons, causes };
}

/** Escribe las lecciones como nota del cerebro (siempre inyectada). */
function writeLessonsNote(config, summary, analysis) {
  const { lessons, causes, losers } = analysis;
  const vault = expandHome(config.brain?.vault_path || '~/Desktop/cerebro-trading');
  const file = path.join(vault, '00-principios', 'lecciones-aprendidas.md');
  const date = new Date(Date.now()).toISOString().slice(0, 10);
  const causeLines = (causes || [])
    .map((c) => `- **${c.count}** pérdidas → ${c.cause}`)
    .join('\n');
  const body = `---
title: Lecciones aprendidas (de trades perdidos)
type: principio
tags: [lecciones, errores, backtest, perdidas, aprendizaje, causa-raiz]
bias: [long, short]
regime: [any]
timeframe: [any]
weight: high
---

# Lecciones aprendidas (de trades perdidos)

Generado del backtest/diario (${date}). Muestra: ${summary.total} trades,
${summary.wins} ganados / ${summary.losses} perdidos (WR ${pct(summary.winRate)}, ${summary.totalR >= 0 ? '+' : ''}${summary.totalR}R).

El bot debe ANALIZAR estos errores y mejorar su criterio con ellos (ver [[analizar-errores]]),
no solo evitarlos a ciegas.

## Análisis de causa raíz de los ${losers} trades perdidos
${causeLines || '- (sin pérdidas en la muestra)'}

## Lecciones derivadas
${lessons.map((l) => `- ${l}`).join('\n')}

**Regla para el bot:** Estudia la causa raíz de cada error de arriba. Para cada futura entrada que se parezca a un error pasado, identifica QUÉ condición faltó (contexto, confluencia, régimen, timing o stop) y EXÍGELA antes de tomarla. Aprende del error para afinar el criterio; sé más estricto donde fallaste, no simplemente inactivo.

Relacionado: [[analizar-errores]], [[criterio-propio]], [[proceso-sobre-resultado]], [[confluencia]]
`;
  try {
    fs.writeFileSync(file, body);
    return file;
  } catch (e) {
    return null;
  }
}

function summarize(trades) {
  const wins = trades.filter((t) => t.result === 'win').length;
  const losses = trades.filter((t) => t.result === 'loss').length;
  const timeouts = trades.filter((t) => t.result === 'timeout').length;
  const totalR = trades.reduce((a, t) => a + t.r, 0);
  const decided = wins + losses;
  const winRate = decided ? wins / decided : 0;
  const grossWin = trades.filter((t) => t.r > 0).reduce((a, t) => a + t.r, 0);
  const grossLoss = Math.abs(trades.filter((t) => t.r < 0).reduce((a, t) => a + t.r, 0));
  return {
    total: trades.length,
    wins,
    losses,
    timeouts,
    winRate,
    totalR: round(totalR, 2),
    expectancy: trades.length ? round(totalR / trades.length, 3) : 0,
    profitFactor: grossLoss ? round(grossWin / grossLoss, 2) : null,
  };
}

const round = (v, dp = 2) =>
  v == null || Number.isNaN(v) ? null : Math.round(v * 10 ** dp) / 10 ** dp;
const pct = (x) => `${Math.round(x * 100)}%`;

/** Descarga el OHLCV de todos los símbolos UNA vez (para reusar entre variantes). */
async function fetchData(config, timeframe, limit, onProgress = () => {}) {
  const ex = new ExchangeClient(config);
  const symbols = await ex.resolveSymbols();
  const data = {};
  for (let i = 0; i < symbols.length; i++) {
    const s = symbols[i];
    onProgress({ symbol: s, i: i + 1, total: symbols.length });
    try {
      const o = await ex.fetchOHLCV(s, timeframe, limit);
      if (o.close.length >= WARMUP + 20) data[s] = o;
    } catch (e) {
      /* salta */
    }
  }
  return data;
}

/** Corre el backtest sobre datos ya descargados con unos filtros dados. */
function runOnData(data, opts = {}) {
  const all = [];
  for (const [s, o] of Object.entries(data)) all.push(...backtestSymbol(s, o, opts));
  return { summary: summarize(all), trades: all };
}

async function runBacktest(config, { timeframe = '1h', limit = 720, opts = {}, onProgress = () => {} } = {}) {
  const data = await fetchData(config, timeframe, limit, onProgress);
  const { summary, trades } = runOnData(data, opts);
  const analysis = deriveLessons(trades);
  const noteFile = writeLessonsNote(config, summary, analysis);
  return { summary, lessons: analysis.lessons, causes: analysis.causes, trades, noteFile };
}

module.exports = { runBacktest, fetchData, runOnData, deriveLessons, summarize };

// CLI: descarga una vez y COMPARA baseline vs variantes mejoradas.
if (require.main === module) {
  (async () => {
    const config = loadConfig();
    const timeframe = process.argv[2] || '1h';
    const limit = parseInt(process.argv[3], 10) || 720;
    console.log(`Backtest comparativo · ${timeframe} · ${limit} velas/símbolo\n`);

    const data = await fetchData(config, timeframe, limit, ({ i, total, symbol }) =>
      process.stderr.write(`\r  descargando ${i}/${total} ${symbol}        `)
    );
    process.stderr.write('\r' + ' '.repeat(40) + '\r');

    const variantes = [
      { nombre: 'Baseline (actual)', opts: {} },
      { nombre: '+ ADX≥22 (solo tendencia real)', opts: { minAdx: 22 } },
      { nombre: '+ Solo a favor de EMA200', opts: { withTrendOnly: true } },
      { nombre: '+ ADX≥22 y a favor EMA200', opts: { minAdx: 22, withTrendOnly: true } },
      { nombre: '+ Score≥4 (más selectivo)', opts: { minScore: 4 } },
      { nombre: '+ ADX≥25, EMA200, target 3R', opts: { minAdx: 25, withTrendOnly: true, rr: 3 } },
    ];

    const filas = variantes.map((v) => ({ v, s: runOnData(data, v.opts).summary }));

    console.log('=== COMPARACIÓN (mejorar el 47%) ===\n');
    console.log('Configuración'.padEnd(34) + 'Trades  WR    R total   Expect  PF');
    console.log('-'.repeat(78));
    for (const { v, s } of filas) {
      console.log(
        v.nombre.padEnd(34) +
          String(s.total).padEnd(8) +
          pct(s.winRate).padEnd(6) +
          `${s.totalR >= 0 ? '+' : ''}${s.totalR}R`.padEnd(10) +
          `${s.expectancy}`.padEnd(8) +
          `${s.profitFactor ?? '—'}`
      );
    }

    // Mejor por expectativa (con mínimo de trades para que sea significativo).
    const significativas = filas.filter((f) => f.s.total >= 20);
    const mejor = (significativas.length ? significativas : filas).sort(
      (a, b) => b.s.expectancy - a.s.expectancy
    )[0];
    const base = filas[0].s;
    console.log('\n=== MEJOR CONFIGURACIÓN ===');
    console.log(`→ ${mejor.v.nombre}`);
    console.log(
      `   WR ${pct(mejor.s.winRate)} (baseline ${pct(base.winRate)}) · ` +
        `Expectativa ${mejor.s.expectancy}R (baseline ${base.expectancy}R) · ` +
        `PF ${mejor.s.profitFactor} (baseline ${base.profitFactor})`
    );
    const mejoraWR = Math.round((mejor.s.winRate - base.winRate) * 100);
    const mejoraExp = round(mejor.s.expectancy - base.expectancy, 3);
    console.log(`   Mejora: ${mejoraWR >= 0 ? '+' : ''}${mejoraWR}pp de WR, ${mejoraExp >= 0 ? '+' : ''}${mejoraExp}R de expectativa.`);

    // Guarda lecciones de la mejor variante en el cerebro.
    const best = runOnData(data, mejor.v.opts);
    const analysis = deriveLessons(best.trades);
    writeLessonsNote(config, best.summary, analysis);
    console.log('\nLecciones (de la mejor variante) guardadas en el cerebro.');
  })().catch((e) => {
    console.error('Error:', e.message);
    process.exit(1);
  });
}

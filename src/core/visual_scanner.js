'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { ExchangeClient } = require('./exchange');
const { AIEngine } = require('./ai');
const { TradingViewController } = require('./tradingview');
const { rankSymbols, loadConfig, round } = require('./scanner');
const { Brain, regimeFromCandidate } = require('./brain');
const { Journal } = require('./journal');

/**
 * Pipeline VISUAL: el bot conduce la app nativa de TradingView, recorre la
 * watchlist priorizada por indicadores, captura cada gráfico por temporalidad,
 * deja que la IA de visión lo lea, y luego la IA de decisión combina
 * indicadores + lectura visual en una señal.
 *
 * onProgress(stage, info) para que la UI muestre avance.
 * Devuelve { signals, scanned, visited, errors }
 */
async function runVisualScan(config, { onProgress = () => {} } = {}) {
  const ex = new ExchangeClient(config);
  const ai = new AIEngine(config, process.env.OPENROUTER_API_KEY);
  const tv = new TradingViewController(config);

  // La visión es obligatoria en este modo, sin importar el flag global.
  ai.cfg = { ...ai.cfg, use_vision: true };

  const errors = [];
  const tfs = config.timeframes;
  const maxVisual = config.tradingview?.max_symbols_visual || 8;

  // --- Etapa 1: ranking por indicadores (rápido, gratis) ---
  onProgress('resolving', {});
  const symbols = await ex.resolveSymbols();
  onProgress('symbols', { count: symbols.length });
  const ranked = await rankSymbols(config, ex, symbols, { onProgress, errors });

  // Recorremos la watchlist completa pero en orden de prioridad, con tope práctico.
  const toVisit = ranked.slice(0, maxVisual);
  onProgress('candidates', { count: toVisit.length });

  // --- Cerebro + diario ---
  const brain = new Brain(config).load();
  const journal = new Journal(config);
  const historyContext = journal.statsContext();
  const limit = journal.dailyLimitHit(config);
  if (limit.hit) {
    onProgress('halt', { reason: limit.reason });
    return { signals: [], scanned: ranked.length, visited: 0, errors, halted: limit.reason };
  }
  const lastTf = tfs[tfs.length - 1] || 'any';

  // --- Etapa 2: conducir TradingView ---
  if (!(await tv.isAvailable())) {
    throw new Error(
      'No se pudo controlar el sistema. Da permiso de Accesibilidad a la app ' +
        '(Ajustes > Privacidad y seguridad > Accesibilidad) y vuelve a intentar.'
    );
  }
  await tv.activate();

  const signals = [];
  for (let i = 0; i < toVisit.length; i++) {
    const c = toVisit[i];
    onProgress('tv-symbol', { symbol: c.symbol, i: i + 1, total: toVisit.length });
    try {
      await tv.setSymbol(c.symbol);

      // --- Etapa 3: capturar + leer cada timeframe con visión ---
      const visualReadings = {};
      for (const tf of tfs) {
        onProgress('tv-capture', { symbol: c.symbol, tf });
        await tv.setTimeframe(tf);
        const shot = await tv.capture(`${c.symbol.replace('/', '')}-${tf}`);
        try {
          const reading = await ai.describeChart(c.symbol, shot.dataUrl, tf);
          visualReadings[tf] = reading;
        } catch (e) {
          visualReadings[tf] = { error: e.message };
          errors.push({ symbol: c.symbol, tf, error: `visión: ${e.message}` });
        }
      }

      // --- Etapa 4: decisión combinando indicadores + visión + cerebro ---
      onProgress('ai', { symbol: c.symbol, i: i + 1, total: toVisit.length });
      const regime = regimeFromCandidate(c);
      const brainContext = brain.contextFor({ bias: c.bias, regime, timeframe: lastTf });
      const decision = await ai.decide({ ...c, visualReadings }, { brainContext, historyContext });
      if (decision.action && decision.action !== 'none') {
        const signal = {
          symbol: c.symbol,
          ...decision,
          regime,
          localScore: round(c.score),
          rr: computeRR(decision),
          visualReadings,
          ts: nowISO(),
        };
        signal.journalFile = journal.logSignal(signal);
        signals.push(signal);
      }
    } catch (e) {
      errors.push({ symbol: c.symbol, error: e.message });
    }
  }

  signals.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
  onProgress('done', { signals: signals.length });
  return { signals, scanned: ranked.length, visited: toVisit.length, errors };
}

function computeRR(d) {
  if (!d.entry || !d.stop || !d.target) return null;
  const risk = Math.abs(d.entry - d.stop);
  const reward = Math.abs(d.target - d.entry);
  if (risk === 0) return null;
  return round(reward / risk, 2);
}

function nowISO() {
  try {
    return new Date(Date.now()).toISOString();
  } catch {
    return '';
  }
}

module.exports = { runVisualScan };

// Permite correr directamente: `node src/core/visual_scanner.js`
if (require.main === module) {
  (async () => {
    const config = loadConfig();
    console.log('Escaneo VISUAL: el bot va a controlar TradingView. Abre la app y no toques el teclado.\n');
    const res = await runVisualScan(config, {
      onProgress: (stage, info) => {
        if (stage === 'symbols') console.log(`Símbolos: ${info.count}`);
        if (stage === 'candidates') console.log(`A visitar en TradingView: ${info.count}`);
        if (stage === 'tv-symbol') console.log(`\n▶ ${info.symbol} (${info.i}/${info.total})`);
        if (stage === 'tv-capture') console.log(`   capturando ${info.tf}…`);
        if (stage === 'ai') console.log(`   IA decidiendo…`);
      },
    });
    console.log('\n=== SEÑALES (con visión) ===');
    if (!res.signals.length) console.log('Sin señales de alta probabilidad.');
    for (const s of res.signals) {
      console.log(
        `\n${s.action.toUpperCase()} ${s.symbol}  [conf ${s.confidence}%, ${s.style}, ${s.timeframe}]\n` +
          `  entrada ${s.entry} | stop ${s.stop} | target ${s.target} | R:R ${s.rr}\n  ${s.rationale}`
      );
    }
    if (res.errors.length) console.log(`\n(${res.errors.length} incidencias)`);
  })().catch((e) => {
    console.error('Error fatal:', e.message);
    process.exit(1);
  });
}

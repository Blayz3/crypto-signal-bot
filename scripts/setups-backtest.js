'use strict';

/**
 * Backtest POR SETUP del cerebro: detecta mecánicamente cada setup (pullback a EMA,
 * retest, ruptura, rechazo en S/R, reversión RSI, momentum MACD) y mide cómo rinde
 * cada uno (~3 meses, varias monedas). Guarda el ranking en el cerebro para que el
 * bot priorice los setups que de verdad ganan.
 *
 * Stop 2×ATR, target 2R (valores validados). Uso: node scripts/setups-backtest.js [dias]
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const ccxt = require('ccxt');
const { computeIndicators } = require('../src/core/indicators');

function loadConfig() {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '../config.json'), 'utf8'));
}
const expandHome = (p) => (p.startsWith('~') ? path.join(os.homedir(), p.slice(1)) : p);
const round = (v, dp = 2) => (v == null || Number.isNaN(v) ? null : Math.round(v * 10 ** dp) / 10 ** dp);
const pct = (x) => `${Math.round(x * 100)}%`;
const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);

const TF_MS = 3600000;
const WARMUP = 210;
const MAX_HOLD = 48;
const ATR_MULT = 2.0; // stop validado out-of-sample
const RR = 2;

async function fetchHistory(ex, symbol, candlesWanted) {
  let since = Date.now() - candlesWanted * TF_MS;
  const out = [];
  while (out.length < candlesWanted) {
    const batch = await ex.fetchOHLCV(symbol, '1h', since, 1000);
    if (!batch.length) break;
    out.push(...batch);
    since = batch[batch.length - 1][0] + TF_MS;
    if (batch.length < 1000) break;
  }
  return out;
}

/** Precomputa indicadores por barra (lo costoso, una vez). */
function precompute(C) {
  const n = C.c.length;
  const snaps = new Array(n).fill(null);
  for (let i = WARMUP; i < n; i++) {
    const sl = (a) => a.slice(0, i + 1);
    const ind = computeIndicators({
      time: sl(C.t), open: sl(C.o), high: sl(C.h), low: sl(C.l), close: sl(C.c), volume: sl(C.v),
    });
    if (ind && ind.atr) snaps[i] = ind;
  }
  return snaps;
}

const alignedUp = (s) => s.ema20 > s.ema50 && s.ema50 > s.ema200;
const alignedDown = (s) => s.ema20 < s.ema50 && s.ema50 < s.ema200;

// --- Detectores de setup: devuelven 'long' | 'short' | null en la barra i ---
const DETECTORS = {
  'pullback-ema': (i, C, snaps) => {
    const s = snaps[i]; if (!s || s.adx < 20) return null;
    if (alignedUp(s) && C.l[i] <= s.ema20 * 1.004 && C.c[i] > s.ema20 && C.c[i] > C.o[i]) return 'long';
    if (alignedDown(s) && C.h[i] >= s.ema20 * 0.996 && C.c[i] < s.ema20 && C.c[i] < C.o[i]) return 'short';
    return null;
  },
  ruptura: (i, C) => {
    if (i < 21) return null;
    const hh = Math.max(...C.h.slice(i - 20, i)), ll = Math.min(...C.l.slice(i - 20, i));
    const av = mean(C.v.slice(i - 20, i));
    if (C.c[i] > hh && C.v[i] > av * 1.2) return 'long';
    if (C.c[i] < ll && C.v[i] > av * 1.2) return 'short';
    return null;
  },
  retest: (i, C) => {
    if (i < 30) return null;
    // ¿hubo ruptura en [i-8..i-2]? el nivel roto se retestea ahora.
    for (let k = i - 2; k >= i - 8; k--) {
      const hh = Math.max(...C.h.slice(k - 20, k));
      if (C.c[k] > hh) { // ruptura alcista en k, nivel hh
        if (C.l[i] <= hh * 1.005 && C.c[i] > hh) return 'long';
      }
      const ll = Math.min(...C.l.slice(k - 20, k));
      if (C.c[k] < ll) {
        if (C.h[i] >= ll * 0.995 && C.c[i] < ll) return 'short';
      }
    }
    return null;
  },
  'rechazo-sr': (i, C) => {
    if (i < 21) return null;
    const ll = Math.min(...C.l.slice(i - 20, i)), hh = Math.max(...C.h.slice(i - 20, i));
    const rng = C.h[i] - C.l[i] || 1e-9;
    // barre mínimo previo pero cierra arriba (rechazo de soporte) -> long
    if (C.l[i] < ll && C.c[i] > C.l[i] + rng * 0.6) return 'long';
    if (C.h[i] > hh && C.c[i] < C.h[i] - rng * 0.6) return 'short';
    return null;
  },
  'rsi-reversion': (i, C, snaps) => {
    const s = snaps[i]; if (!s || s.rsiPrev == null) return null;
    if (s.rsiPrev < 30 && s.rsi >= 30) return 'long';
    if (s.rsiPrev > 70 && s.rsi <= 70) return 'short';
    return null;
  },
  'momentum-macd': (i, C, snaps) => {
    const s = snaps[i]; if (!s || s.macdHistPrev == null) return null;
    if (alignedUp(s) && s.macdHistPrev <= 0 && s.macdHist > 0) return 'long';
    if (alignedDown(s) && s.macdHistPrev >= 0 && s.macdHist < 0) return 'short';
    return null;
  },
};

/** Simula los trades de un setup en un símbolo. Devuelve array de R. */
function runSetup(detector, C, snaps) {
  const n = C.c.length;
  const rs = [];
  let pos = null;
  for (let i = WARMUP; i < n; i++) {
    if (pos) {
      const long = pos.dir === 'long';
      const hitStop = long ? C.l[i] <= pos.stop : C.h[i] >= pos.stop;
      const hitTarget = long ? C.h[i] >= pos.target : C.l[i] <= pos.target;
      let r = null;
      if (hitStop) r = -1;
      else if (hitTarget) r = RR;
      else if (i - pos.openBar >= MAX_HOLD)
        r = round((long ? C.c[i] - pos.entry : pos.entry - C.c[i]) / pos.risk, 2);
      if (r != null) { rs.push(r); pos = null; }
      continue;
    }
    const s = snaps[i]; if (!s) continue;
    const dir = detector(i, C, snaps);
    if (!dir) continue;
    const risk = ATR_MULT * s.atr;
    const entry = C.c[i];
    pos = {
      dir, entry, risk, openBar: i,
      stop: dir === 'long' ? entry - risk : entry + risk,
      target: dir === 'long' ? entry + RR * risk : entry - RR * risk,
    };
  }
  return rs;
}

function summarize(rs) {
  const wins = rs.filter((r) => r > 0).length, losses = rs.filter((r) => r < 0).length;
  const totalR = rs.reduce((a, r) => a + r, 0);
  const gW = rs.filter((r) => r > 0).reduce((a, r) => a + r, 0);
  const gL = Math.abs(rs.filter((r) => r < 0).reduce((a, r) => a + r, 0));
  return {
    trades: rs.length, wins, losses,
    wr: wins + losses ? wins / (wins + losses) : 0,
    expectancy: rs.length ? round(totalR / rs.length, 3) : 0,
    totalR: round(totalR, 1),
    pf: gL ? round(gW / gL, 2) : null,
  };
}

function writeNote(config, days, ranked, nCoins) {
  const vault = expandHome(config.brain?.vault_path || '~/Desktop/cerebro-trading');
  const date = new Date(Date.now()).toISOString().slice(0, 10);
  const rows = ranked
    .map((r) => `| ${r.setup} | ${r.s.trades} | ${pct(r.s.wr)} | ${r.s.expectancy}R | ${r.s.pf ?? '—'} |`)
    .join('\n');
  const best = ranked.filter((r) => r.s.trades >= 20 && r.s.expectancy > 0).map((r) => r.setup);
  const worst = ranked.filter((r) => r.s.trades >= 20 && r.s.expectancy <= 0).map((r) => r.setup);
  const note = `---
title: Rendimiento de los setups (auto-backtest)
type: principio
tags: [setups, rendimiento, backtest, ranking, expectativa]
bias: [long, short]
regime: [any]
timeframe: [1h]
weight: high
---

# Rendimiento de los setups (auto-backtest)

Backtest mecánico del ${date}: ~${days} días, ${nCoins} monedas, 1h, stop 2×ATR, target 2R.
Mide cómo rinde cada setup del cerebro con datos reales. Ordenado por expectativa (profit).

| Setup | Trades | WR | Expectativa | PF |
|---|---|---|---|---|
${rows}

**Setups que GANAN (priorízalos):** ${best.length ? best.join(', ') : '—'}.
**Setups DÉBILES (exige confluencia extra o evítalos):** ${worst.length ? worst.join(', ') : '—'}.

**Regla para el bot:** Prioriza los setups con mejor expectativa de esta tabla y trátalos con más confianza. Con los setups débiles (expectativa ≤ 0), exige confluencia extra (contexto + nivel + datos de mercado) o devuelve none. Los números son del motor mecánico; tu criterio y la confluencia los mejoran.

Relacionado: [[configuracion-optima]], [[confluencia]], [[expectativa-y-winrate]], [[analizar-errores]]
`;
  const file = path.join(vault, '00-principios', 'setups-rendimiento.md');
  fs.writeFileSync(file, note);
  return file;
}

module.exports = { DETECTORS, precompute, fetchHistory, runSetup, summarize, WARMUP, alignedUp, alignedDown };

if (require.main === module)
(async () => {
  const config = loadConfig();
  const days = parseInt(process.argv[2], 10) || 90;
  const ex = require("../src/core/data-exchange").spotClient();

  // Universo: top por volumen (varias monedas).
  const cfgTop = { ...config, watchlist: [], auto_top_volume: 20 };
  const { ExchangeClient } = require('../src/core/exchange');
  const symbols = await new ExchangeClient(cfgTop).resolveSymbols();
  process.stderr.write(`Universo: ${symbols.length} monedas · ${days} días\n`);

  // Acumula R por setup a lo largo de todas las monedas.
  const bySetup = {};
  for (const k of Object.keys(DETECTORS)) bySetup[k] = [];

  for (let si = 0; si < symbols.length; si++) {
    const sym = symbols[si];
    process.stderr.write(`\r  ${si + 1}/${symbols.length} ${sym}          `);
    try {
      const raw = await fetchHistory(ex, sym, days * 24);
      if (raw.length < WARMUP + 50) continue;
      const C = {
        t: raw.map((r) => r[0]), o: raw.map((r) => r[1]), h: raw.map((r) => r[2]),
        l: raw.map((r) => r[3]), c: raw.map((r) => r[4]), v: raw.map((r) => r[5]),
      };
      const snaps = precompute(C);
      for (const [name, det] of Object.entries(DETECTORS)) bySetup[name].push(...runSetup(det, C, snaps));
    } catch (e) { /* skip */ }
  }
  process.stderr.write('\r' + ' '.repeat(40) + '\r');

  const ranked = Object.entries(bySetup)
    .map(([setup, rs]) => ({ setup, s: summarize(rs) }))
    .sort((a, b) => b.s.expectancy - a.s.expectancy);

  console.log(`\n=== RENDIMIENTO POR SETUP (${days} días, ${symbols.length} monedas) ===\n`);
  console.log('Setup'.padEnd(16) + 'Trades  WR    Expect  PF');
  console.log('-'.repeat(46));
  for (const { setup, s } of ranked)
    console.log(setup.padEnd(16) + `${String(s.trades).padEnd(7)} ${pct(s.wr).padEnd(5)} ${String(s.expectancy).padEnd(7)} ${s.pf ?? '—'}`);

  const file = writeNote(config, days, ranked, symbols.length);
  console.log(`\nGuardado en el cerebro: ${file.replace(os.homedir(), '~')}`);
})().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});

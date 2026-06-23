'use strict';

/**
 * Grid search del motor mecánico para encontrar la mejor configuración,
 * PRIORIZANDO PROFIT (expectativa R/trade) sobre win rate.
 *
 * Eficiencia: precomputa los indicadores/score de cada barra UNA vez por símbolo
 * (lo caro), y luego barre decenas de configuraciones reusando esos snapshots.
 *
 * Uso: node scripts/optimize.js
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const { ExchangeClient } = require('../src/core/exchange');
const { computeIndicators, scoreSignal } = require('../src/core/indicators');

function loadConfig() {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '../config.json'), 'utf8'));
}
function expandHome(p) {
  return p.startsWith('~') ? path.join(os.homedir(), p.slice(1)) : p;
}
const round = (v, dp = 2) => (v == null || Number.isNaN(v) ? null : Math.round(v * 10 ** dp) / 10 ** dp);
const pct = (x) => `${Math.round(x * 100)}%`;

const WARMUP = 210;
const MAX_HOLD = 48;
const ATR_MULT = 1.5;

/** Precomputa el snapshot de indicadores en cada barra (lo costoso, una vez). */
function precompute(o) {
  const n = o.close.length;
  const snaps = new Array(n).fill(null);
  for (let i = WARMUP; i < n; i++) {
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
    snaps[i] = {
      score: sc.score,
      adx: ind.adx || 0,
      atr: ind.atr,
      price: ind.price,
      ema200: ind.ema200,
    };
  }
  return snaps;
}

/** Simula trades usando snapshots precomputados + OHLCV (barato → para el barrido). */
function simulate(o, snaps, opts) {
  const { minScore, minAdx, withTrendOnly, rr } = opts;
  const atrMult = opts.atrMult ?? ATR_MULT;
  const trades = [];
  let pos = null;
  const n = o.close.length;
  for (let i = WARMUP; i < n; i++) {
    if (pos) {
      const long = pos.dir === 'long';
      const hitStop = long ? o.low[i] <= pos.stop : o.high[i] >= pos.stop;
      const hitTarget = long ? o.high[i] >= pos.target : o.low[i] <= pos.target;
      let r = null;
      if (hitStop) r = -1;
      else if (hitTarget) r = rr;
      else if (i - pos.openBar >= MAX_HOLD)
        r = round(((long ? o.close[i] - pos.entry : pos.entry - o.close[i]) / pos.risk), 2);
      if (r != null) {
        trades.push(r);
        pos = null;
      }
      continue;
    }
    const s = snaps[i];
    if (!s) continue;
    if (Math.abs(s.score) < minScore) continue;
    if (s.adx < minAdx) continue;
    const dir = s.score > 0 ? 'long' : 'short';
    const counterTrend = dir === 'long' ? s.price < s.ema200 : s.price > s.ema200;
    if (withTrendOnly && counterTrend) continue;
    const risk = atrMult * s.atr;
    pos = {
      dir,
      entry: s.price,
      risk,
      stop: dir === 'long' ? s.price - risk : s.price + risk,
      target: dir === 'long' ? s.price + rr * risk : s.price - rr * risk,
      openBar: i,
    };
  }
  return trades;
}

function summarize(rs) {
  const wins = rs.filter((r) => r > 0).length;
  const losses = rs.filter((r) => r < 0).length;
  const decided = wins + losses;
  const totalR = rs.reduce((a, r) => a + r, 0);
  const grossWin = rs.filter((r) => r > 0).reduce((a, r) => a + r, 0);
  const grossLoss = Math.abs(rs.filter((r) => r < 0).reduce((a, r) => a + r, 0));
  return {
    trades: rs.length,
    wins,
    losses,
    winRate: decided ? wins / decided : 0,
    totalR: round(totalR, 1),
    expectancy: rs.length ? round(totalR / rs.length, 3) : 0,
    profitFactor: grossLoss ? round(grossWin / grossLoss, 2) : null,
  };
}

(async () => {
  const config = loadConfig();
  const ex = new ExchangeClient(config);
  const OOS = process.env.OPT_OOS === '1'; // out-of-sample: monedas distintas

  let symbols;
  if (OOS) {
    // Top por volumen EXCLUYENDO la watchlist → monedas que el bot no tuneó.
    const wl = new Set(await new ExchangeClient(config).resolveSymbols());
    const top = await new ExchangeClient({ ...config, watchlist: [], auto_top_volume: 45 }).resolveSymbols();
    symbols = top.filter((s) => !wl.has(s)).slice(0, 25);
    console.error(`Universo OUT-OF-SAMPLE: ${symbols.length} monedas distintas a tu watchlist.`);
  } else {
    symbols = await ex.resolveSymbols();
  }
  const TFs = ['15m', '1h', '4h'];
  const LIMIT = 600;

  // Grid de parámetros (ahora con multiplicador de ATR).
  const grid = [];
  for (const minScore of [2, 2.5, 3])
    for (const minAdx of [0, 25, 30])
      for (const withTrendOnly of [false, true])
        for (const rr of [1.5, 2, 3])
          for (const atrMult of [1.0, 1.5, 2.0])
            grid.push({ minScore, minAdx, withTrendOnly, rr, atrMult });

  const results = [];
  for (const tf of TFs) {
    process.stderr.write(`\rDescargando+precomputando ${tf}...                 `);
    const snapsBySym = {};
    const dataBySym = {};
    for (const s of symbols) {
      try {
        const o = await ex.fetchOHLCV(s, tf, LIMIT);
        if (o.close.length < WARMUP + 20) continue;
        dataBySym[s] = o;
        snapsBySym[s] = precompute(o);
      } catch (e) {
        /* skip */
      }
    }
    for (const opts of grid) {
      const allR = [];
      for (const s of Object.keys(dataBySym)) allR.push(...simulate(dataBySym[s], snapsBySym[s], opts));
      const sum = summarize(allR);
      results.push({ tf, opts, sum });
    }
  }
  process.stderr.write('\r' + ' '.repeat(50) + '\r');

  // Filtra config con muestra significativa.
  const sig = results.filter((r) => r.sum.trades >= 40);
  const byProfit = [...sig].sort((a, b) => b.sum.expectancy - a.sum.expectancy);
  const byWR = [...sig].sort((a, b) => b.sum.winRate - a.sum.winRate);

  const fmt = (r) =>
    `${r.tf.padEnd(4)} score≥${r.opts.minScore} adx≥${r.opts.minAdx} ${r.opts.withTrendOnly ? 'trend' : 'ambos'} ${r.opts.rr}R atr${r.opts.atrMult}`.padEnd(40) +
    `${r.sum.trades}t  WR ${pct(r.sum.winRate)}  ${r.sum.totalR >= 0 ? '+' : ''}${r.sum.totalR}R  exp ${r.sum.expectancy}  PF ${r.sum.profitFactor}`;

  console.log(`Grid search: ${grid.length} configs × ${TFs.length} TFs = ${results.length} pruebas`);
  console.log(`Universo: ${OOS ? 'OUT-OF-SAMPLE (monedas distintas)' : 'watchlist'} · ${symbols.length} monedas\n`);
  console.log('=== TOP 10 POR PROFIT (expectativa R/trade) — prioridad ===');
  byProfit.slice(0, 10).forEach((r, i) => console.log(`${String(i + 1).padStart(2)}. ${fmt(r)}`));
  console.log('\n=== TOP 5 POR WIN RATE ===');
  byWR.slice(0, 5).forEach((r, i) => console.log(`${String(i + 1).padStart(2)}. ${fmt(r)}`));

  const best = byProfit[0];
  console.log('\n=== MEJOR CONFIG (profit > WR) ===');
  console.log(fmt(best));

  // Validación: ¿cómo rinde TU config actual (ADX≥25) en estos datos?
  const liveAdx = config.funnel?.min_adx || 25;
  const valid = results.find(
    (r) => r.tf === '1h' && r.opts.minScore === 2 && r.opts.minAdx === liveAdx && !r.opts.withTrendOnly && r.opts.rr === 3 && r.opts.atrMult === 1.5
  );
  if (valid) {
    console.log(`\n=== VALIDACIÓN de tu config actual (1h, ADX≥${liveAdx}, 3R) ===`);
    console.log(fmt(valid));
  }

  if (OOS) {
    console.log('\n(Validación out-of-sample: NO se sobrescribe el cerebro.)');
    return;
  }

  // Guarda el hallazgo como nota del cerebro (siempre inyectada).
  const vault = expandHome(config.brain?.vault_path || '~/Desktop/cerebro-trading');
  const date = new Date(Date.now()).toISOString().slice(0, 10);
  const note = `---
title: Configuración óptima (optimización backtest)
type: principio
tags: [optimizacion, parametros, profit, expectativa, backtest]
bias: [long, short]
regime: [any]
timeframe: [any]
weight: high
---

# Configuración óptima (optimización backtest)

Grid search del ${date} sobre ${TFs.join('/')}, priorizando PROFIT (expectativa R/trade) sobre win rate.

**Mejor configuración:** ${best.tf}, score≥${best.opts.minScore}, ADX≥${best.opts.minAdx}, ${best.opts.withTrendOnly ? 'solo a favor de tendencia' : 'ambas direcciones'}, target ${best.opts.rr}R.
- Win Rate ${pct(best.sum.winRate)} · Expectativa ${best.sum.expectancy}R/trade · Profit Factor ${best.sum.profitFactor} · ${best.sum.trades} trades.

**Aprendizajes para el bot:**
- Exigir ADX ≥ ${best.opts.minAdx || 22} (tendencia real) mejora la expectativa: evita el rango/chop.
- Un target de ${best.opts.rr}R maximiza el profit aunque baje el WR (profit > WR).
- ${best.opts.withTrendOnly ? 'Operar SOLO a favor de la EMA200 reduce pérdidas de contra-tendencia.' : 'Operar ambas direcciones funcionó mejor en esta muestra (con criterio).'}

**Regla para el bot:** Favorece entradas con ADX ≥ ${best.opts.minAdx || 22} y apunta a R:R ≥ ${best.opts.rr} cuando la estructura lo permita. Prioriza la expectativa (profit por trade) sobre el porcentaje de aciertos: pocos trades de alto R:R baten a muchos de bajo R:R.

Relacionado: [[expectativa-y-winrate]], [[objetivo-profit]], [[lecciones-aprendidas]], [[tendencia-vs-rango]]
`;
  fs.writeFileSync(path.join(vault, '00-principios', 'configuracion-optima.md'), note);
  console.log('\nGuardado en el cerebro: 00-principios/configuracion-optima.md');

  // Exporta los mejores params para aplicarlos.
  console.log(`\nAPLICAR → min_adx:${best.opts.minAdx} min_score:${best.opts.minScore} target:${best.opts.rr}R tf:${best.tf}`);
})().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});

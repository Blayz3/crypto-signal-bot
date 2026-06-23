'use strict';

/**
 * Busca una configuración con PROFIT FACTOR ≥ 3 (muy rentable, WR secundario),
 * aplicando filtros de calidad (ADX, a favor de tendencia) y exits que dejan
 * correr los ganadores (targets amplios 3-6R y trailing stop) a los setups de
 * tendencia. VALIDA el ganador out-of-sample (monedas distintas) para descartar
 * sobreajuste. Si es robusto, lo guarda en el cerebro.
 *
 * Uso: node scripts/setups-optimize.js [dias]
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const ccxt = require('ccxt');
const { ExchangeClient } = require('../src/core/exchange');
const { DETECTORS, precompute, fetchHistory, WARMUP } = require('./setups-backtest');

function loadConfig() {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '../config.json'), 'utf8'));
}
const expandHome = (p) => (p.startsWith('~') ? path.join(os.homedir(), p.slice(1)) : p);
const round = (v, dp = 2) => (v == null || Number.isNaN(v) ? null : Math.round(v * 10 ** dp) / 10 ** dp);
const pct = (x) => `${Math.round(x * 100)}%`;
const MAX_HOLD = 48;

/** Detector con filtros de calidad (ADX mínimo + a favor de EMA200). */
function filtered(base, minAdx, withTrend) {
  return (i, C, snaps) => {
    const dir = base(i, C, snaps);
    if (!dir) return null;
    const s = snaps[i];
    if (s.adx < minAdx) return null;
    if (withTrend) {
      const counter = dir === 'long' ? s.price < s.ema200 : s.price > s.ema200;
      if (counter) return null;
    }
    return dir;
  };
}

/** Simula con exit fijo (rr) o trailing stop. Devuelve array de R. */
function simulate(detector, C, snaps, opts) {
  const atrMult = opts.atrMult ?? 2;
  const exit = opts.exit;
  const rs = [];
  let pos = null;
  const n = C.c.length;
  for (let i = WARMUP; i < n; i++) {
    if (pos) {
      const long = pos.dir === 'long';
      pos.ext = long ? Math.max(pos.ext, C.h[i]) : Math.min(pos.ext, C.l[i]);
      let r = null;
      if (exit.type === 'fixed') {
        const hitStop = long ? C.l[i] <= pos.stop : C.h[i] >= pos.stop;
        const hitTarget = long ? C.h[i] >= pos.target : C.l[i] <= pos.target;
        if (hitStop) r = -1;
        else if (hitTarget) r = exit.rr;
      } else {
        // trailing: tras avanzar beAt×riesgo, sube a BE y arrastra a dist×ATR del extremo
        const fav = long ? pos.ext - pos.entry : pos.entry - pos.ext;
        if (fav >= exit.beAt * pos.risk) {
          const trailStop = long ? pos.ext - exit.dist * pos.atr : pos.ext + exit.dist * pos.atr;
          pos.stop = long
            ? Math.max(pos.stop, pos.entry, trailStop)
            : Math.min(pos.stop, pos.entry, trailStop);
        }
        const hitStop = long ? C.l[i] <= pos.stop : C.h[i] >= pos.stop;
        if (hitStop) r = round((long ? pos.stop - pos.entry : pos.entry - pos.stop) / pos.risk, 2);
      }
      if (r == null && i - pos.openBar >= MAX_HOLD)
        r = round((long ? C.c[i] - pos.entry : pos.entry - C.c[i]) / pos.risk, 2);
      if (r != null) { rs.push(r); pos = null; }
      continue;
    }
    const s = snaps[i]; if (!s) continue;
    const dir = detector(i, C, snaps);
    if (!dir) continue;
    const risk = atrMult * s.atr;
    const entry = C.c[i];
    pos = {
      dir, entry, risk, atr: s.atr, openBar: i, ext: entry,
      stop: dir === 'long' ? entry - risk : entry + risk,
      target: dir === 'long' ? entry + (exit.rr || 99) * risk : entry - (exit.rr || 99) * risk,
    };
  }
  return rs;
}

function summarize(rs) {
  const wins = rs.filter((r) => r > 0), losses = rs.filter((r) => r < 0);
  const gW = wins.reduce((a, r) => a + r, 0), gL = Math.abs(losses.reduce((a, r) => a + r, 0));
  const totalR = rs.reduce((a, r) => a + r, 0);
  return {
    trades: rs.length,
    wr: wins.length + losses.length ? wins.length / (wins.length + losses.length) : 0,
    pf: gL ? round(gW / gL, 2) : null,
    expectancy: rs.length ? round(totalR / rs.length, 3) : 0,
    totalR: round(totalR, 1),
  };
}

async function fetchUniverse(config) {
  // Top 40 por volumen → in-sample = 1..20, out-of-sample = 21..40 (disjuntos).
  const top = await new ExchangeClient({ ...config, watchlist: [], auto_top_volume: 40 }).resolveSymbols();
  return { inSample: top.slice(0, 20), oos: top.slice(20, 40) };
}

async function loadData(ex, symbols, days, label) {
  const data = {};
  for (let i = 0; i < symbols.length; i++) {
    process.stderr.write(`\r  ${label} ${i + 1}/${symbols.length} ${symbols[i]}        `);
    try {
      const raw = await fetchHistory(ex, symbols[i], days * 24);
      if (raw.length < WARMUP + 50) continue;
      const C = {
        t: raw.map((r) => r[0]), o: raw.map((r) => r[1]), h: raw.map((r) => r[2]),
        l: raw.map((r) => r[3]), c: raw.map((r) => r[4]), v: raw.map((r) => r[5]),
      };
      data[symbols[i]] = { C, snaps: precompute(C) };
    } catch (e) { /* skip */ }
  }
  process.stderr.write('\r' + ' '.repeat(50) + '\r');
  return data;
}

function runConfig(data, cfg) {
  const det = filtered(DETECTORS[cfg.setup], cfg.minAdx, cfg.withTrend);
  const rs = [];
  for (const k of Object.keys(data)) rs.push(...simulate(det, data[k].C, data[k].snaps, cfg));
  return summarize(rs);
}

(async () => {
  const config = loadConfig();
  const days = parseInt(process.argv[2], 10) || 90;
  const ex = new ccxt.binance({ enableRateLimit: true });

  const { inSample, oos } = await fetchUniverse(config);
  console.error(`In-sample: ${inSample.length} monedas · OOS: ${oos.length} monedas · ${days} días`);
  const dataIn = await loadData(ex, inSample, days, 'in-sample');

  // Grid: setups de tendencia × filtros × exits.
  const setups = ['momentum-macd', 'pullback-ema', 'ruptura', 'retest'];
  const exits = [
    { type: 'fixed', rr: 3 }, { type: 'fixed', rr: 4 }, { type: 'fixed', rr: 5 }, { type: 'fixed', rr: 6 },
    { type: 'trail', beAt: 1, dist: 2.5 }, { type: 'trail', beAt: 1, dist: 4 }, { type: 'trail', beAt: 1.5, dist: 3 },
  ];
  const grid = [];
  for (const setup of setups)
    for (const minAdx of [25, 30, 35])
      for (const atrMult of [1.5, 2])
        for (const exit of exits)
          grid.push({ setup, minAdx, withTrend: true, atrMult, exit });

  const fmtExit = (e) => (e.type === 'fixed' ? `${e.rr}R` : `trail${e.beAt}/${e.dist}`);
  const label = (c) => `${c.setup} adx${c.minAdx} atr${c.atrMult} ${fmtExit(c.exit)}`;

  const results = grid
    .map((cfg) => ({ cfg, s: runConfig(dataIn, cfg) }))
    .filter((r) => r.s.trades >= 25)
    .sort((a, b) => (b.s.pf || 0) - (a.s.pf || 0));

  console.log(`\n=== TOP 12 POR PROFIT FACTOR (in-sample) ===`);
  console.log('Config'.padEnd(40) + 'Trades  WR   PF    Exp');
  results.slice(0, 12).forEach((r) =>
    console.log(label(r.cfg).padEnd(40) + `${String(r.s.trades).padEnd(7)} ${pct(r.s.wr).padEnd(4)} ${String(r.s.pf).padEnd(5)} ${r.s.expectancy}`)
  );

  // Candidatos con PF≥3 in-sample → validar out-of-sample.
  const pf3 = results.filter((r) => r.s.pf >= 3);
  console.log(`\n${pf3.length} configs con PF≥3 in-sample. Validando en monedas distintas...`);
  const dataOos = await loadData(ex, oos, days, 'oos');

  let robust = null;
  console.log('\n=== VALIDACIÓN OUT-OF-SAMPLE (PF≥3 candidatos) ===');
  console.log('Config'.padEnd(40) + 'IS-PF  OOS-PF  OOS-trades  OOS-exp');
  for (const r of pf3.slice(0, 15)) {
    const oosS = runConfig(dataOos, r.cfg);
    const ok = oosS.pf >= 3 && oosS.trades >= 15;
    console.log(
      label(r.cfg).padEnd(40) +
        `${String(r.s.pf).padEnd(6)} ${String(oosS.pf ?? '—').padEnd(7)} ${String(oosS.trades).padEnd(11)} ${oosS.expectancy}` +
        (ok ? '  ✅ ROBUSTO' : '')
    );
    if (ok && (!robust || oosS.pf > robust.oos.pf)) robust = { cfg: r.cfg, is: r.s, oos: oosS };
  }

  console.log('\n=== RESULTADO ===');
  if (robust) {
    console.log(`✅ PF≥3 ROBUSTO logrado: ${label(robust.cfg)}`);
    console.log(`   In-sample: PF ${robust.is.pf}, WR ${pct(robust.is.wr)}, exp ${robust.is.expectancy}R, ${robust.is.trades} trades`);
    console.log(`   Out-of-sample: PF ${robust.oos.pf}, WR ${pct(robust.oos.wr)}, exp ${robust.oos.expectancy}R, ${robust.oos.trades} trades`);
    writeNote(config, days, robust, label(robust.cfg));
    console.log('   Guardado en el cerebro: 00-principios/config-pf3.md');
  } else {
    const bestOos = pf3.length
      ? pf3.map((r) => ({ r, oos: runConfig(dataOos, r.cfg) })).sort((a, b) => (b.oos.pf || 0) - (a.oos.pf || 0))[0]
      : null;
    console.log('❌ No se encontró PF≥3 que AGUANTE out-of-sample (con ≥15 trades).');
    console.log('   Esto significa que un PF≥3 estable no es realista en esta muestra: sería sobreajuste.');
    if (bestOos)
      console.log(`   Lo más cercano robusto: ${label(bestOos.r.cfg)} → OOS PF ${bestOos.oos.pf}, exp ${bestOos.oos.expectancy}R.`);
  }
})().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});

function writeNote(config, days, robust, lbl) {
  const vault = expandHome(config.brain?.vault_path || '~/Desktop/cerebro-trading');
  const date = new Date(Date.now()).toISOString().slice(0, 10);
  const note = `---
title: Config PF≥3 robusta (validada out-of-sample)
type: principio
tags: [pf, profit-factor, robusto, trailing, tendencia, optimizacion]
bias: [long, short]
regime: [trending]
timeframe: [1h]
weight: high
---

# Config PF≥3 robusta (validada out-of-sample)

Búsqueda del ${date} (~${days} días). Se logró Profit Factor ≥ 3 **validado en monedas
distintas** (no sobreajuste): \`${lbl}\`.

- In-sample: PF ${robust.is.pf} · WR ${pct(robust.is.wr)} · exp ${robust.is.expectancy}R · ${robust.is.trades} trades.
- Out-of-sample: PF ${robust.oos.pf} · WR ${pct(robust.oos.wr)} · exp ${robust.oos.expectancy}R · ${robust.oos.trades} trades.

**Cómo se logra el PF alto:** setup de tendencia (${robust.cfg.setup}) + filtro ADX≥${robust.cfg.minAdx}
+ solo a favor de la EMA200 + ${robust.cfg.exit.type === 'trail' ? 'trailing stop (dejar correr ganadores)' : `target amplio ${robust.cfg.exit.rr}R`}.
El WR puede ser bajo; lo que da el PF≥3 es **dejar correr los ganadores** mientras se cortan
rápido los perdedores.

**Regla para el bot:** Para máxima rentabilidad, prioriza el setup de tendencia "${robust.cfg.setup}" con ADX≥${robust.cfg.minAdx}, solo a favor de la EMA200, y ${robust.cfg.exit.type === 'trail' ? 'usa trailing stop para dejar correr los ganadores' : `apunta a ${robust.cfg.exit.rr}R dejando correr`}. Acepta WR bajo: el profit viene de los ganadores grandes, no del % de aciertos.

Relacionado: [[configuracion-optima]], [[gestion-posicion]], [[objetivo-profit]], [[momentum-vs-reversion]]
`;
  fs.writeFileSync(path.join(vault, '00-principios', 'config-pf3.md'), note);
}

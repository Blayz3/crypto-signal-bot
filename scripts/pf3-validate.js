'use strict';
// Valida los candidatos PF≥3 (ADX45 + 3×ATR + trailing) IN-SAMPLE vs OUT-OF-SAMPLE.
const ccxt = require('ccxt');
const fs = require('fs');
const path = require('path');
const { ExchangeClient } = require('../src/core/exchange');
const { DETECTORS, precompute, fetchHistory, WARMUP } = require('./setups-backtest');
const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../config.json'), 'utf8'));
const round = (v, d = 2) => (v == null || Number.isNaN(v) ? null : Math.round(v * 10 ** d) / 10 ** d);
const pct = (x) => `${Math.round(x * 100)}%`;
const MAX_HOLD = 72;

function filtered(base, minAdx) {
  return (i, C, s) => {
    const d = base(i, C, s); if (!d) return null;
    if (s[i].adx < minAdx) return null;
    const counter = d === 'long' ? s[i].price < s[i].ema200 : s[i].price > s[i].ema200;
    return counter ? null : d;
  };
}
function simulate(det, C, snaps, o) {
  const rs = []; let pos = null;
  for (let i = WARMUP; i < C.c.length; i++) {
    if (pos) {
      const long = pos.dir === 'long';
      pos.ext = long ? Math.max(pos.ext, C.h[i]) : Math.min(pos.ext, C.l[i]);
      let r = null;
      const fav = long ? pos.ext - pos.entry : pos.entry - pos.ext;
      if (fav >= o.beAt * pos.risk) {
        const t = long ? pos.ext - o.dist * pos.atr : pos.ext + o.dist * pos.atr;
        pos.stop = long ? Math.max(pos.stop, pos.entry, t) : Math.min(pos.stop, pos.entry, t);
      }
      if (long ? C.l[i] <= pos.stop : C.h[i] >= pos.stop)
        r = round((long ? pos.stop - pos.entry : pos.entry - pos.stop) / pos.risk, 2);
      if (r == null && i - pos.openBar >= MAX_HOLD)
        r = round((long ? C.c[i] - pos.entry : pos.entry - C.c[i]) / pos.risk, 2);
      if (r != null) { rs.push(r); pos = null; }
      continue;
    }
    const s = snaps[i]; if (!s) continue;
    const d = det(i, C, snaps); if (!d) continue;
    const risk = o.atrMult * s.atr, e = C.c[i];
    pos = { dir: d, entry: e, risk, atr: s.atr, openBar: i, ext: e, stop: d === 'long' ? e - risk : e + risk };
  }
  return rs;
}
function sum(rs) {
  const w = rs.filter(r => r > 0), l = rs.filter(r => r < 0);
  const gw = w.reduce((a, r) => a + r, 0), gl = Math.abs(l.reduce((a, r) => a + r, 0));
  return { n: rs.length, wr: w.length + l.length ? w.length / (w.length + l.length) : 0, pf: gl ? round(gw / gl, 2) : null, exp: rs.length ? round(rs.reduce((a, r) => a + r, 0) / rs.length, 3) : 0 };
}
async function load(ex, syms, days, lbl) {
  const data = {};
  for (const sy of syms) { process.stderr.write(`\r${lbl} ${sy}      `);
    try { const raw = await fetchHistory(ex, sy, days * 24); if (raw.length < WARMUP + 50) continue;
      data[sy] = { C: { t: raw.map(r => r[0]), o: raw.map(r => r[1]), h: raw.map(r => r[2]), l: raw.map(r => r[3]), c: raw.map(r => r[4]), v: raw.map(r => r[5]) } };
      data[sy].snaps = precompute(data[sy].C); } catch (e) {} }
  process.stderr.write('\r' + ' '.repeat(30) + '\r'); return data;
}
function run(data, cfg) { const rs = []; const det = filtered(DETECTORS[cfg.setup], cfg.minAdx);
  for (const k of Object.keys(data)) rs.push(...simulate(det, data[k].C, data[k].snaps, cfg)); return sum(rs); }

(async () => {
  const ex = new ccxt.binance({ enableRateLimit: true });
  const top = await new ExchangeClient({ ...config, watchlist: [], auto_top_volume: 30 }).resolveSymbols();
  const inS = top.slice(0, 12), oos = top.slice(12, 28);
  console.log(`In-sample: ${inS.length} · OOS: ${oos.length} · 150 días`);
  const dIn = await load(ex, inS, 150, 'IS');
  const dOos = await load(ex, oos, 150, 'OOS');
  const cands = [
    { setup: 'momentum-macd', minAdx: 45, atrMult: 3, beAt: 1, dist: 6 },
    { setup: 'momentum-macd', minAdx: 45, atrMult: 3, beAt: 2, dist: 5 },
    { setup: 'momentum-macd', minAdx: 40, atrMult: 3, beAt: 1, dist: 6 },
    { setup: 'pullback-ema', minAdx: 45, atrMult: 3, beAt: 1, dist: 6 },
    { setup: 'pullback-ema', minAdx: 40, atrMult: 3, beAt: 1, dist: 6 },
  ];
  console.log('\nConfig'.padEnd(34) + 'IS: PF/trades/exp     OOS: PF/trades/exp     ¿robusto?');
  let best = null;
  for (const c of cands) {
    const is = run(dIn, c), os = run(dOos, c);
    const robust = os.pf >= 3 && os.n >= 15 && is.pf >= 3;
    const lbl = `${c.setup} adx${c.minAdx} atr${c.atrMult} tr${c.beAt}/${c.dist}`;
    console.log(lbl.padEnd(34) + `${is.pf}/${is.n}/${is.exp}`.padEnd(22) + `${os.pf}/${os.n}/${os.exp}`.padEnd(22) + (robust ? '✅ SÍ' : 'no'));
    if (robust && (!best || os.pf > best.os.pf)) best = { c, is, os, lbl };
  }
  console.log('\n=== VEREDICTO ===');
  if (best) console.log(`✅ PF≥3 ROBUSTO (validado OOS): ${best.lbl} → IS PF ${best.is.pf}, OOS PF ${best.os.pf} (${best.os.n} trades OOS)`);
  else console.log('❌ Ningún candidato PF≥3 aguanta out-of-sample con ≥15 trades. El PF≥3 in-sample era muestra pequeña/sobreajuste.');
})().catch(e => console.error('Error:', e.message));

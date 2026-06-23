'use strict';
// Último intento: parámetros EXTREMOS para ver si PF≥3 es alcanzable de algún modo.
const ccxt = require('ccxt');
const { ExchangeClient } = require('../src/core/exchange');
const { DETECTORS, precompute, fetchHistory, WARMUP } = require('./setups-backtest');
const fs = require('fs');
const path = require('path');
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
      if (o.exit.type === 'fixed') {
        if (long ? C.l[i] <= pos.stop : C.h[i] >= pos.stop) r = -1;
        else if (long ? C.h[i] >= pos.target : C.l[i] <= pos.target) r = o.exit.rr;
      } else {
        const fav = long ? pos.ext - pos.entry : pos.entry - pos.ext;
        if (fav >= o.exit.beAt * pos.risk) {
          const t = long ? pos.ext - o.exit.dist * pos.atr : pos.ext + o.exit.dist * pos.atr;
          pos.stop = long ? Math.max(pos.stop, pos.entry, t) : Math.min(pos.stop, pos.entry, t);
        }
        if (long ? C.l[i] <= pos.stop : C.h[i] >= pos.stop)
          r = round((long ? pos.stop - pos.entry : pos.entry - pos.stop) / pos.risk, 2);
      }
      if (r == null && i - pos.openBar >= MAX_HOLD)
        r = round((long ? C.c[i] - pos.entry : pos.entry - C.c[i]) / pos.risk, 2);
      if (r != null) { rs.push(r); pos = null; }
      continue;
    }
    const s = snaps[i]; if (!s) continue;
    const d = det(i, C, snaps); if (!d) continue;
    const risk = o.atrMult * s.atr, e = C.c[i];
    pos = { dir: d, entry: e, risk, atr: s.atr, openBar: i, ext: e,
      stop: d === 'long' ? e - risk : e + risk, target: d === 'long' ? e + (o.exit.rr || 99) * risk : e - (o.exit.rr || 99) * risk };
  }
  return rs;
}
function sum(rs) {
  const w = rs.filter((r) => r > 0), l = rs.filter((r) => r < 0);
  const gw = w.reduce((a, r) => a + r, 0), gl = Math.abs(l.reduce((a, r) => a + r, 0));
  return { n: rs.length, wr: w.length + l.length ? w.length / (w.length + l.length) : 0, pf: gl ? round(gw / gl, 2) : null, exp: rs.length ? round(rs.reduce((a, r) => a + r, 0) / rs.length, 3) : 0 };
}
(async () => {
  const ex = new ccxt.binance({ enableRateLimit: true });
  const syms = (await new ExchangeClient({ ...config, watchlist: [], auto_top_volume: 12 }).resolveSymbols());
  const data = {};
  for (const sy of syms) {
    process.stderr.write(`\r${sy}        `);
    try { const raw = await fetchHistory(ex, sy, 120 * 24); if (raw.length < WARMUP + 50) continue;
      const C = { t: raw.map(r => r[0]), o: raw.map(r => r[1]), h: raw.map(r => r[2]), l: raw.map(r => r[3]), c: raw.map(r => r[4]), v: raw.map(r => r[5]) };
      data[sy] = { C, snaps: precompute(C) }; } catch (e) {}
  }
  process.stderr.write('\r' + ' '.repeat(30) + '\r');
  const exits = [{ type: 'fixed', rr: 6 }, { type: 'fixed', rr: 8 }, { type: 'fixed', rr: 10 }, { type: 'trail', beAt: 1, dist: 5 }, { type: 'trail', beAt: 1, dist: 6 }, { type: 'trail', beAt: 2, dist: 5 }];
  const out = [];
  for (const setup of ['momentum-macd', 'pullback-ema']) for (const minAdx of [35, 40, 45]) for (const atrMult of [2, 2.5, 3]) for (const exit of exits) {
    const det = filtered(DETECTORS[setup], minAdx); const rs = [];
    for (const k of Object.keys(data)) rs.push(...simulate(det, data[k].C, data[k].snaps, { atrMult, exit }));
    const s = sum(rs); if (s.n >= 20) out.push({ cfg: `${setup} adx${minAdx} atr${atrMult} ${exit.type === 'fixed' ? exit.rr + 'R' : 'trail' + exit.beAt + '/' + exit.dist}`, s });
  }
  out.sort((a, b) => (b.s.pf || 0) - (a.s.pf || 0));
  console.log('=== EXTREMO — TOP 10 POR PF (120 días, 12 monedas) ===');
  out.slice(0, 10).forEach((r) => console.log(r.cfg.padEnd(38) + `${r.s.n}t WR ${pct(r.s.wr)} PF ${r.s.pf} exp ${r.s.exp}`));
  console.log(`\nMáximo PF alcanzado: ${out[0]?.s.pf} (${out[0]?.cfg})`);
  console.log(out[0]?.s.pf >= 3 ? '✅ PF≥3 posible (revisar muestra/robustez)' : '❌ Ni con params extremos se alcanza PF 3. Techo mecánico ~' + out[0]?.s.pf);
})().catch((e) => console.error('Error:', e.message));

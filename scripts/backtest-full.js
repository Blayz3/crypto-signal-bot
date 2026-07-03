'use strict';

/**
 * BACKTEST DEL SISTEMA COMPLETO (como opera hoy el autobot mecánico):
 *  - Universo: top-volumen del exchange de config (KuCoin), como el bot en vivo.
 *  - Embudo: |score| >= min_local_score y ADX >= min_adx (1h).
 *  - Límites del autobot: máx 4 trades nuevos/día, 1 por símbolo/día, máx 2 por dirección/día,
 *    no reentrar si el símbolo ya tiene posición abierta.
 *  - Gestión (monitor real): stop 2×ATR (cap 8% del precio), TP 2R, RUNNER (parcial 50% en TP,
 *    stop a BE, TP2 al doble). Comparado contra salida FIJA 2R.
 *  - Cuenta paper real: $1000, margen 200 × 0.5 (grado C mecánico) × compuesto (0.25–5×),
 *    leverage 20x (<$20) / 40x (>=$20), pérdida capada al margen.
 *  - Reporta lo que importa para dinero real: expectativa, PF y MAX DRAWDOWN + racha perdedora.
 *  - Ventanas: período completo y últimos 30 días por separado (robustez).
 *
 * Uso: node scripts/backtest-full.js [días=90] [monedas=20]
 * HONESTO: esto backtestea el motor MECÁNICO (grado C). La capa de IA (A+/A/B) no se puede
 * replayar sobre historia; en vivo debería mejorar la selección, pero NO está medido aquí.
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { computeIndicators, scoreSignal } = require('../src/core/indicators');
const { fetchHistory, precompute, WARMUP } = require('./setups-backtest');
const { ExchangeClient } = require('../src/core/exchange');

const TF_MS = 3600000;
const r2 = (x) => Math.round(x * 100) / 100;

function loadConfig() {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '../config.json'), 'utf8'));
}

async function pMap(items, fn, concurrency = 6) {
  const ret = new Array(items.length);
  let idx = 0;
  async function worker() {
    while (idx < items.length) { const cur = idx++; ret[cur] = await fn(items[cur], cur); }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return ret;
}

/** Gestión del monitor real. Devuelve { rRunner, rFixed, closeIdx }. */
function simulateTrade(C, startIdx, dir, entry, stop, target) {
  const long = dir === 'long';
  const risk = Math.abs(entry - stop) || entry * 0.01;
  const tpR = Math.abs(target - entry) / risk;
  const target2 = entry + (long ? 1 : -1) * 2 * Math.abs(target - entry);
  let phase = 1;
  let rFixed = null;
  let fixedIdx = null;
  for (let i = startIdx; i < C.c.length; i++) {
    const hi = C.h[i], lo = C.l[i];
    if (rFixed === null) { // salida fija 2R (comparación)
      const hs = long ? lo <= stop : hi >= stop;
      const ht = long ? hi >= target : lo <= target;
      if (hs) { rFixed = -1; fixedIdx = i; }
      else if (ht) { rFixed = tpR; fixedIdx = i; }
    }
    if (phase === 1) {
      const hs = long ? lo <= stop : hi >= stop;
      const ht = long ? hi >= target : lo <= target;
      if (hs) return { rRunner: -1, rFixed: -1, closeIdx: i };
      if (ht) { phase = 2; continue; }
    } else {
      const hitBE = long ? lo <= entry : hi >= entry;
      const hitTP2 = long ? hi >= target2 : lo <= target2;
      if (hitBE) return { rRunner: r2(0.5 * tpR), rFixed: tpR, closeIdx: i };
      if (hitTP2) return { rRunner: r2(1.5 * tpR), rFixed: tpR, closeIdx: i };
    }
  }
  // fin de datos: cierra al último precio (honesto: no dejar trades colgados fuera del cálculo)
  const lastC = C.c[C.c.length - 1];
  const move = (long ? lastC - entry : entry - lastC) / risk;
  const rEnd = phase === 2 ? r2(0.5 * tpR + 0.5 * Math.max(0, move)) : r2(Math.max(-1, move));
  return { rRunner: rEnd, rFixed: rFixed ?? r2(Math.max(-1, move)), closeIdx: C.c.length - 1, openEnd: true };
}

/**
 * Cuenta paper. mode:
 *  - {type:'fixed', base}: margen fijo × compuesto (regla actual $200×grado)
 *  - {type:'riskpct', pct}: margen = pct% del balance (estándar para dinero real)
 */
function simulateAccount(trades, useRunner, p, mode) {
  const START = p.starting_balance || 1000;
  const events = [];
  for (const t of trades) {
    events.push({ ts: t.openTs, type: 'open', t });
    events.push({ ts: t.closeTs, type: 'close', t });
  }
  events.sort((a, b) => a.ts - b.ts || (a.type === 'close' ? -1 : 1)); // cierres antes que aperturas en el mismo ts
  let bal = START, peak = START, maxDD = 0, streak = 0, worstStreak = 0;
  for (const ev of events) {
    if (ev.type === 'open') {
      if (mode.type === 'riskpct') {
        ev.t.margin = r2(Math.max(1, bal * (mode.pct / 100)));
      } else {
        const cf = Math.min(5, Math.max(0.25, bal / START));
        ev.t.margin = r2(mode.base * cf);
      }
      ev.t.lev = ev.t.entry < (p.leverage_price_threshold || 20) ? (p.leverage_low || 20) : (p.leverage_high || 40);
    } else {
      const t = ev.t;
      if (t.margin == null) continue;
      const r = useRunner ? t.rRunner : t.rFixed;
      const notional = t.margin * t.lev;
      const raw = notional * (r * t.riskPct); // r en R × riesgo% = movimiento equivalente
      const pnl = r2(Math.max(-t.margin, raw));
      bal = r2(bal + pnl);
      if (pnl < 0) { streak++; worstStreak = Math.max(worstStreak, streak); } else if (pnl > 0) streak = 0;
      peak = Math.max(peak, bal);
      maxDD = Math.max(maxDD, (peak - bal) / peak);
    }
  }
  return { final: bal, maxDD: r2(maxDD * 100), worstStreak };
}

function stats(rs) {
  if (!rs.length) return { n: 0 };
  const wins = rs.filter((r) => r > 0), losses = rs.filter((r) => r < 0);
  const sum = rs.reduce((a, b) => a + b, 0);
  const gp = wins.reduce((a, b) => a + b, 0), gl = Math.abs(losses.reduce((a, b) => a + b, 0));
  return {
    n: rs.length, wr: r2((wins.length / rs.length) * 100), sumR: r2(sum),
    exp: r2(sum / rs.length), pf: gl > 0 ? r2(gp / gl) : Infinity,
  };
}

(async () => {
  const config = loadConfig();
  const days = parseInt(process.argv[2] || '90', 10);
  const nCoins = parseInt(process.argv[3] || '20', 10);
  const candles = days * 24 + WARMUP;
  const minScore = config.funnel?.min_local_score ?? 1;
  const minAdx = process.env.MIN_ADX ? parseInt(process.env.MIN_ADX, 10) : (config.funnel?.min_adx ?? 18);
  const maxPerDay = config.funnel?.daily_target_signals ?? 4;
  const maxPerDir = config.funnel?.max_signals_per_direction ?? 2;
  const stopMult = config.risk?.atr_stop_mult ?? 2;
  const rr = config.risk?.default_rr ?? 2;

  console.log(`Backtest sistema completo: ${days} días, top ${nCoins} monedas (${config.exchange}), stop ${stopMult}×ATR cap 8%, TP ${rr}R + runner.`);
  const ex = new ExchangeClient(config);
  const symbols = (await ex.resolveSymbols()).slice(0, nCoins);
  console.log(`Símbolos: ${symbols.join(', ')}`);

  // Descarga + precompute (lo pesado) en paralelo.
  const data = {};
  await pMap(symbols, async (sym) => {
    try {
      const rows = await fetchHistory(ex.ex, sym, candles);
      if (rows.length < WARMUP + 200) return;
      const C = { t: rows.map(r => r[0]), o: rows.map(r => r[1]), h: rows.map(r => r[2]), l: rows.map(r => r[3]), c: rows.map(r => r[4]), v: rows.map(r => r[5]) };
      data[sym] = { C, snaps: precompute(C) };
      process.stdout.write(`  ${sym}: ${rows.length} velas ✓\n`);
    } catch (e) {
      process.stdout.write(`  ${sym}: error ${e.message}\n`);
    }
  }, 6);

  // Línea de tiempo global (todas las horas presentes).
  const allTs = [...new Set(Object.values(data).flatMap(d => d.C.t))].sort((a, b) => a - b);
  const idxBySym = {};
  for (const [sym, d] of Object.entries(data)) {
    idxBySym[sym] = new Map(d.C.t.map((ts, i) => [ts, i]));
  }

  // Selección cronológica con los límites del autobot.
  const trades = [];
  const openUntil = {}; // sym -> closeTs
  let dayKey = '', dayCount = 0, dirCount = { long: 0, short: 0 }, daySyms = new Set();
  for (const ts of allTs) {
    const dk = new Date(ts).toISOString().slice(0, 10);
    if (dk !== dayKey) { dayKey = dk; dayCount = 0; dirCount = { long: 0, short: 0 }; daySyms = new Set(); }
    // candidatas de esta hora
    const cands = [];
    for (const [sym, d] of Object.entries(data)) {
      const i = idxBySym[sym].get(ts);
      if (i == null || i < WARMUP || i >= d.C.c.length - 2) continue;
      if ((openUntil[sym] || 0) >= ts) continue;
      if (daySyms.has(sym)) continue;
      const s = d.snaps[i]; if (!s || !s.atr) continue;
      const sc = scoreSignal(s);
      if (Math.abs(sc.score) < minScore) continue;
      if (s.adx != null && s.adx < minAdx) continue;
      const dir = sc.score > 0 ? 'long' : 'short';
      cands.push({ sym, i, dir, score: Math.abs(sc.score) });
    }
    cands.sort((a, b) => b.score - a.score);
    for (const cd of cands) {
      if (dayCount >= maxPerDay) break;
      if (dirCount[cd.dir] >= maxPerDir) continue;
      const d = data[cd.sym];
      const entry = d.C.c[cd.i];
      const atr = d.snaps[cd.i].atr;
      const riskDist = Math.min(stopMult * atr, entry * 0.08); // cap 8% (mechanicalPlan)
      const long = cd.dir === 'long';
      const stop = long ? entry - riskDist : entry + riskDist;
      const target = long ? entry + rr * riskDist : entry - rr * riskDist;
      const sim = simulateTrade(d.C, cd.i + 1, cd.dir, entry, stop, target);
      trades.push({
        sym: cd.sym, dir: cd.dir, entry, openTs: ts, closeTs: d.C.t[sim.closeIdx],
        rRunner: sim.rRunner, rFixed: sim.rFixed, riskPct: riskDist / entry, openEnd: !!sim.openEnd,
      });
      openUntil[cd.sym] = d.C.t[sim.closeIdx];
      dayCount++; dirCount[cd.dir]++; daySyms.add(cd.sym);
    }
  }

  // --- Resultados ---
  const cutoff30 = Date.now() - 30 * 86400000;
  const report = (label, list) => {
    const sR = stats(list.map(t => t.rRunner));
    const sF = stats(list.map(t => t.rFixed));
    console.log(`\n=== ${label}: ${list.length} trades ===`);
    console.log(`  RUNNER : WR ${sR.wr}% · total ${sR.sumR >= 0 ? '+' : ''}${sR.sumR}R · expectativa ${sR.exp}R/trade · PF ${sR.pf}`);
    console.log(`  FIJO 2R: WR ${sF.wr}% · total ${sF.sumR >= 0 ? '+' : ''}${sF.sumR}R · expectativa ${sF.exp}R/trade · PF ${sF.pf}`);
  };
  report('PERÍODO COMPLETO', trades);
  report('ÚLTIMOS 30 DÍAS', trades.filter(t => t.openTs >= cutoff30));

  const p = config.paper || {};
  console.log(`\n=== CUENTA ($1000 inicio, lev 20/40x, runner) — escenarios de TAMAÑO (${days} días, ADX>=${minAdx}) ===`);
  const scenarios = [
    ['actual: $200×0.5 compuesto (≈10% riesgo/trade)', { type: 'fixed', base: 100 }],
    ['riesgo 3% del balance por trade', { type: 'riskpct', pct: 3 }],
    ['riesgo 5% del balance por trade', { type: 'riskpct', pct: 5 }],
  ];
  for (const [label, mode] of scenarios) {
    const a = simulateAccount(trades, true, p, mode);
    console.log(`  ${label}: final $${a.final} · MAX DD ${a.maxDD}% · peor racha ${a.worstStreak}`);
  }
  const openEndN = trades.filter(t => t.openEnd).length;
  if (openEndN) console.log(`  (${openEndN} trades cerrados al último precio por fin de datos)`);
  console.log('\nHONESTO: motor mecánico (grado C) sin la capa de IA. La IA en vivo filtra/mejora la selección pero NO está medida aquí.');
})().catch((e) => { console.error('Error:', e.message); process.exit(1); });

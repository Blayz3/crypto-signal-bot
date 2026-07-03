'use strict';

/**
 * PASO 3 del backtest con Claude como capa de IA:
 * Toma las tarjetas (/tmp/claude-cards.json) y las decisiones de Claude
 * (/tmp/claude-decisions.json: [{id, action, confidence, entry, stop, target, note}]),
 * y simula AMBAS estrategias sobre los mismos momentos históricos:
 *   - MECÁNICO: toma TODAS las tarjetas en la dirección del score (grado C actual)
 *   - CLAUDE  : solo las tarjetas que Claude aprobó, con sus niveles
 * Misma gestión real (runner del monitor), mismos límites del autobot (4/día, 2/dir,
 * 1/símbolo/día, sin reentrada con posición abierta) y misma cuenta (riesgo % balance).
 *
 * Uso: node scripts/claude-backtest-resolve.js
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { fetchHistory } = require('./setups-backtest');
const { ExchangeClient } = require('../src/core/exchange');

const r2 = (x) => Math.round(x * 100) / 100;

function loadConfig() {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '../config.json'), 'utf8'));
}

/** Gestión real del monitor (runner: parcial 50% en TP, BE, TP2 doble). */
function simulateTrade(C, startIdx, dir, entry, stop, target) {
  const long = dir === 'long';
  const risk = Math.abs(entry - stop) || entry * 0.01;
  const tpR = Math.abs(target - entry) / risk;
  const target2 = entry + (long ? 1 : -1) * 2 * Math.abs(target - entry);
  let phase = 1;
  for (let i = startIdx; i < C.c.length; i++) {
    const hi = C.h[i], lo = C.l[i];
    if (phase === 1) {
      const hs = long ? lo <= stop : hi >= stop;
      const ht = long ? hi >= target : lo <= target;
      if (hs) return { r: -1, closeIdx: i };
      if (ht) { phase = 2; continue; }
    } else {
      const hitBE = long ? lo <= entry : hi >= entry;
      const hitTP2 = long ? hi >= target2 : lo <= target2;
      if (hitBE) return { r: r2(0.5 * tpR), closeIdx: i };
      if (hitTP2) return { r: r2(1.5 * tpR), closeIdx: i };
    }
  }
  const lastC = C.c[C.c.length - 1];
  const move = (long ? lastC - entry : entry - lastC) / risk;
  return { r: phase === 2 ? r2(0.5 * tpR + 0.5 * Math.max(0, move)) : r2(Math.max(-1, move)), closeIdx: C.c.length - 1, openEnd: true };
}

/** Aplica límites del autobot y simula. wants = [{card, dir, entry, stop, target, sizeMult}] cronológico. */
function runStrategy(wants, data, maxPerDay, maxPerDir) {
  const trades = [];
  const openUntil = {};
  let dayKey = '', dayCount = 0, dirCount = {}, daySyms = new Set();
  for (const w of wants.sort((a, b) => a.card.ts.localeCompare(b.card.ts))) {
    const sym = w.card.symbol;
    const d = data[sym]; if (!d) continue;
    const ts = Date.parse(w.card.ts);
    const dk = w.card.ts.slice(0, 10);
    if (dk !== dayKey) { dayKey = dk; dayCount = 0; dirCount = { long: 0, short: 0 }; daySyms = new Set(); }
    if (dayCount >= maxPerDay || dirCount[w.dir] >= maxPerDir || daySyms.has(sym)) continue;
    if ((openUntil[sym] || 0) >= ts) continue;
    const i = d.idx.get(ts); if (i == null || i >= d.C.c.length - 2) continue;
    const sim = simulateTrade(d.C, i + 1, w.dir, w.entry, w.stop, w.target);
    trades.push({ sym, dir: w.dir, entry: w.entry, riskPct: Math.abs(w.entry - w.stop) / w.entry, r: sim.r, openTs: ts, closeTs: d.C.t[sim.closeIdx], sizeMult: w.sizeMult || 1 });
    openUntil[sym] = d.C.t[sim.closeIdx];
    dayCount++; dirCount[w.dir] = (dirCount[w.dir] || 0) + 1; daySyms.add(sym);
  }
  return trades;
}

function stats(rs) {
  if (!rs.length) return { n: 0, wr: 0, sumR: 0, exp: 0, pf: 0 };
  const wins = rs.filter((r) => r > 0), losses = rs.filter((r) => r < 0);
  const sum = rs.reduce((a, b) => a + b, 0);
  const gp = wins.reduce((a, b) => a + b, 0), gl = Math.abs(losses.reduce((a, b) => a + b, 0));
  return { n: rs.length, wr: r2((wins.length / rs.length) * 100), sumR: r2(sum), exp: r2(sum / rs.length), pf: gl > 0 ? r2(gp / gl) : Infinity };
}

function account(trades, riskPct, lev = (e) => (e < 20 ? 20 : 40)) {
  let bal = 1000, peak = 1000, maxDD = 0;
  const evs = [];
  for (const t of trades) { evs.push({ ts: t.openTs, type: 'o', t }); evs.push({ ts: t.closeTs, type: 'c', t }); }
  evs.sort((a, b) => a.ts - b.ts || (a.type === 'c' ? -1 : 1));
  for (const ev of evs) {
    if (ev.type === 'o') { ev.t.margin = Math.max(1, bal * (riskPct / 100) * (ev.t.sizeMult || 1)); }
    else {
      const t = ev.t; if (t.margin == null) continue;
      // P&L = nocional × movimiento equivalente (r × riesgo%), capado al margen.
      const pnl = Math.max(-t.margin, t.margin * lev(t.entry) * t.r * t.riskPct);
      bal = r2(bal + pnl);
      peak = Math.max(peak, bal); maxDD = Math.max(maxDD, (peak - bal) / peak);
    }
  }
  return { final: r2(bal), maxDD: r2(maxDD * 100) };
}

(async () => {
  const config = loadConfig();
  const cards = JSON.parse(fs.readFileSync('/tmp/claude-cards.json', 'utf8'));
  const decisions = JSON.parse(fs.readFileSync('/tmp/claude-decisions.json', 'utf8'));
  const decById = new Map(decisions.map((d) => [d.id, d]));
  const maxPerDay = config.funnel?.daily_target_signals ?? 4;
  const maxPerDir = config.funnel?.max_signals_per_direction ?? 2;

  // Historia por símbolo (misma ventana que las tarjetas + margen adelante).
  const symbols = [...new Set(cards.map((c) => c.symbol))];
  const ex = new ExchangeClient(config);
  const data = {};
  for (const sym of symbols) {
    const rows = await fetchHistory(ex.ex, sym, 60 * 24);
    const C = { t: rows.map(r => r[0]), o: rows.map(r => r[1]), h: rows.map(r => r[2]), l: rows.map(r => r[3]), c: rows.map(r => r[4]), v: rows.map(r => r[5]) };
    data[sym] = { C, idx: new Map(C.t.map((ts, i) => [ts, i])) };
    process.stdout.write(`  ${sym} ✓`);
  }
  console.log('');

  // MECÁNICO: toma todas las tarjetas en la dirección del score, stop 2×ATR cap 8%, TP 2R.
  const mechWants = cards.map((card) => {
    const dir = card.funnel.score > 0 ? 'long' : 'short';
    const riskDist = Math.min(2 * card.atrAbs, card.price * 0.08);
    const long = dir === 'long';
    return { card, dir, entry: card.price, stop: long ? card.price - riskDist : card.price + riskDist, target: long ? card.price + 2 * riskDist : card.price - 2 * riskDist, sizeMult: 1 };
  });

  // CLAUDE: solo tarjetas aprobadas, con sus niveles y tamaño por confianza.
  const claudeWants = [];
  let none = 0;
  for (const card of cards) {
    const d = decById.get(card.id);
    if (!d || d.action === 'none') { none++; continue; }
    const sizeMult = d.confidence >= 75 ? 1.5 : d.confidence >= 60 ? 1.25 : 1;
    claudeWants.push({ card, dir: d.action, entry: d.entry ?? card.price, stop: d.stop, target: d.target, sizeMult });
  }

  const mech = runStrategy(mechWants, data, maxPerDay, maxPerDir);
  const clde = runStrategy(claudeWants, data, maxPerDay, maxPerDir);

  const sM = stats(mech.map((t) => t.r));
  const sC = stats(clde.map((t) => t.r * 1)); // R puro
  const sCw = stats(clde.map((t) => t.r * t.sizeMult)); // R ponderado por tamaño
  const aM = account(mech, 3);
  const aC = account(clde, 3);

  console.log(`\n=== MISMAS ${cards.length} TARJETAS (${cards[0].ts.slice(0, 10)} → ${cards[cards.length - 1].ts.slice(0, 10)}) ===`);
  console.log(`MECÁNICO (toma todo):  ${sM.n} trades · WR ${sM.wr}% · ${sM.sumR >= 0 ? '+' : ''}${sM.sumR}R · exp ${sM.exp}R · PF ${sM.pf}`);
  console.log(`CLAUDE  (selectivo) :  ${sC.n} trades (${none} none) · WR ${sC.wr}% · ${sC.sumR >= 0 ? '+' : ''}${sC.sumR}R · exp ${sC.exp}R · PF ${sC.pf}`);
  console.log(`CLAUDE  ponderado×tamaño: ${sCw.sumR >= 0 ? '+' : ''}${sCw.sumR}R · exp ${sCw.exp}R`);
  console.log(`\nCUENTA ($1000, riesgo 3%, runner):`);
  console.log(`  MECÁNICO: final $${aM.final} · max DD ${aM.maxDD}%`);
  console.log(`  CLAUDE  : final $${aC.final} · max DD ${aC.maxDD}%`);
  console.log(`\nDetalle Claude:`);
  for (const t of clde) console.log(`  ${t.dir} ${t.sym} → ${t.r >= 0 ? '+' : ''}${t.r}R`);
})().catch((e) => { console.error('Error:', e.message); process.exit(1); });

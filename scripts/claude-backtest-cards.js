'use strict';

/**
 * PASO 1 del backtest con Claude como capa de IA:
 * Genera TARJETAS DE DECISIÓN históricas — cada una con los datos que el bot
 * tenía EN ESE MOMENTO (nada del futuro): indicadores 1h y 4h, score del embudo,
 * cambios recientes y distancias a extremos. Claude las analiza (aplicando el
 * cerebro) y decide long/short/none. Luego claude-backtest-resolve.js simula.
 *
 * Uso: node scripts/claude-backtest-cards.js [días=14] [monedas=12] [tarjetas/día=6]
 * Salida: /tmp/claude-cards.json
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { computeIndicators, scoreSignal } = require('../src/core/indicators');
const { fetchHistory, precompute, WARMUP } = require('./setups-backtest');
const { ExchangeClient } = require('../src/core/exchange');

const r2 = (x) => (x == null || Number.isNaN(x) ? null : Math.round(x * 100) / 100);
const r4 = (x) => (x == null || Number.isNaN(x) ? null : Math.round(x * 10000) / 10000);
const pct = (a, b) => (a != null && b ? r2(((a - b) / b) * 100) : null);

function loadConfig() {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '../config.json'), 'utf8'));
}

async function pMap(items, fn, concurrency = 6) {
  const ret = new Array(items.length); let idx = 0;
  async function worker() { while (idx < items.length) { const c = idx++; ret[c] = await fn(items[c], c); } }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return ret;
}

/** Resamplea 1h → 4h (bloques alineados) hasta la barra i inclusive. */
function to4h(C, i) {
  const o = [], h = [], l = [], c = [], v = [], t = [];
  const startBlock = Math.floor(C.t[0] / 14400000);
  let cur = null;
  for (let k = 0; k <= i; k++) {
    const b = Math.floor(C.t[k] / 14400000);
    if (cur !== b) { t.push(b * 14400000); o.push(C.o[k]); h.push(C.h[k]); l.push(C.l[k]); c.push(C.c[k]); v.push(C.v[k]); cur = b; }
    else { const n = c.length - 1; h[n] = Math.max(h[n], C.h[k]); l[n] = Math.min(l[n], C.l[k]); c[n] = C.c[k]; v[n] += C.v[k]; }
  }
  return { time: t, open: o, high: h, low: l, close: c, volume: v };
}

function indBlock(s, price) {
  if (!s) return null;
  return {
    rsi: r2(s.rsi), adx: r2(s.adx),
    ema20d: pct(price, s.ema20), ema50d: pct(price, s.ema50), ema200d: pct(price, s.ema200),
    macdH: r4(s.macdHist), atrPct: r2((s.atr / price) * 100),
  };
}

(async () => {
  const config = loadConfig();
  const days = parseInt(process.argv[2] || '14', 10);
  const nCoins = parseInt(process.argv[3] || '12', 10);
  const perDay = parseInt(process.argv[4] || '6', 10);
  const warmupH = 45 * 24; // 45 días para que el 4h tenga EMA200
  const candles = days * 24 + warmupH;
  const minScore = config.funnel?.min_local_score ?? 1;
  const minAdx = config.funnel?.min_adx ?? 18;

  console.log(`Tarjetas: ${days} días, top ${nCoins} monedas, máx ${perDay} tarjetas/día.`);
  const ex = new ExchangeClient(config);
  const symbols = (await ex.resolveSymbols()).slice(0, nCoins);
  console.log(`Símbolos: ${symbols.join(', ')}`);

  const data = {};
  await pMap(symbols, async (sym) => {
    try {
      const rows = await fetchHistory(ex.ex, sym, candles);
      if (rows.length < warmupH) return;
      const C = { t: rows.map(r => r[0]), o: rows.map(r => r[1]), h: rows.map(r => r[2]), l: rows.map(r => r[3]), c: rows.map(r => r[4]), v: rows.map(r => r[5]) };
      data[sym] = { C, snaps: precompute(C) };
      process.stdout.write(`  ${sym}: ${rows.length} velas ✓\n`);
    } catch (e) { process.stdout.write(`  ${sym}: error ${e.message}\n`); }
  }, 6);

  // Candidatas por día → top N por |score| con símbolos distintos.
  const byDay = {};
  for (const [sym, d] of Object.entries(data)) {
    const n = d.C.c.length;
    for (let i = Math.max(WARMUP, warmupH); i < n - 2; i++) {
      const s = d.snaps[i]; if (!s || !s.atr) continue;
      const sc = scoreSignal(s);
      if (Math.abs(sc.score) < minScore) continue;
      if (s.adx != null && s.adx < minAdx) continue;
      const day = new Date(d.C.t[i]).toISOString().slice(0, 10);
      (byDay[day] = byDay[day] || []).push({ sym, i, score: sc.score, bias: sc.bias });
    }
  }

  const cards = [];
  for (const day of Object.keys(byDay).sort()) {
    const seen = new Set();
    const top = byDay[day].sort((a, b) => Math.abs(b.score) - Math.abs(a.score));
    let taken = 0;
    for (const cand of top) {
      if (taken >= perDay) break;
      if (seen.has(cand.sym)) continue;
      seen.add(cand.sym); taken++;
      const d = data[cand.sym];
      const i = cand.i;
      const price = d.C.c[i];
      const s1 = d.snaps[i];
      const ohlcv4 = to4h(d.C, i);
      const s4 = ohlcv4.close.length > 210 ? computeIndicators(ohlcv4) : null;
      const win = (nBars) => ({ hi: Math.max(...d.C.h.slice(Math.max(0, i - nBars), i + 1)), lo: Math.min(...d.C.l.slice(Math.max(0, i - nBars), i + 1)) });
      const w24 = win(24), w480 = win(480);
      const volAvg = d.C.v.slice(i - 168, i - 24).reduce((a, b) => a + b, 0) / 144;
      const vol24 = d.C.v.slice(i - 24, i + 1).reduce((a, b) => a + b, 0) / 25;
      cards.push({
        id: `${cand.sym.replace('/USDT', '')}-${d.C.t[i]}`,
        ts: new Date(d.C.t[i]).toISOString(),
        symbol: cand.sym, price,
        funnel: { score: r2(cand.score), bias: cand.bias },
        h1: indBlock(s1, price),
        h4: s4 ? indBlock(s4, price) : null,
        chg24h: pct(price, d.C.c[i - 24]),
        chg7d: i >= 168 ? pct(price, d.C.c[i - 168]) : null,
        distHi24: pct(w24.hi, price), distLo24: pct(price, w24.lo),
        distHi20d: pct(w480.hi, price), distLo20d: pct(price, w480.lo),
        volRatio24h: volAvg > 0 ? r2(vol24 / volAvg) : null,
        atrAbs: r4(s1.atr),
      });
    }
  }

  fs.writeFileSync('/tmp/claude-cards.json', JSON.stringify(cards, null, 1));
  console.log(`\n${cards.length} tarjetas escritas en /tmp/claude-cards.json (${Object.keys(byDay).length} días).`);
})().catch((e) => { console.error('Error:', e.message); process.exit(1); });

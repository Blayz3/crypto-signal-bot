'use strict';

/**
 * Resumen mensual de resultados → Telegram. Calcula R total, WR, PF, expectativa,
 * mejores/peores setups y el progreso vs la meta mensual (130R).
 *
 * Uso: node scripts/monthly-report.js [YYYY-MM]   (por defecto, el mes anterior)
 * Pensado para correr el día 1 de cada mes (reporta el mes que cerró).
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Journal } = require('../src/core/journal');
const { Telegram } = require('../src/core/telegram');

function loadConfig() {
  return JSON.parse(require('fs').readFileSync(path.join(__dirname, '../config.json'), 'utf8'));
}
const r1 = (x) => Math.round(x * 10) / 10;

(async () => {
  const config = loadConfig();
  const goal = config.brain?.monthly_r_goal || 130;

  // Mes objetivo: argumento, o el mes anterior.
  let month = process.argv[2];
  if (!month) {
    const d = new Date(Date.now());
    const prev = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1));
    month = prev.toISOString().slice(0, 7);
  }

  const journal = new Journal(config);
  const closed = journal
    .readEntries()
    .filter((e) => ['win', 'loss', 'breakeven'].includes(e.status) && (e.date || '').slice(0, 7) === month && !Number.isNaN(e.result_r));

  if (!closed.length) {
    const msg = `📅 RESUMEN ${month}\nNo hubo trades cerrados este mes.`;
    console.log(msg);
    await new Telegram().send(msg);
    return;
  }

  const wins = closed.filter((e) => e.result_r > 0);
  const losses = closed.filter((e) => e.result_r < 0);
  const totalR = closed.reduce((a, e) => a + e.result_r, 0);
  const grossWin = wins.reduce((a, e) => a + e.result_r, 0);
  const grossLoss = Math.abs(losses.reduce((a, e) => a + e.result_r, 0));
  const wr = wins.length + losses.length ? wins.length / (wins.length + losses.length) : 0;
  const pf = grossLoss ? grossWin / grossLoss : null;
  const exp = totalR / closed.length;

  // Por setup
  const bySetup = {};
  for (const e of closed) {
    const k = e.setup || 'sin-setup';
    (bySetup[k] = bySetup[k] || []).push(e.result_r);
  }
  const setups = Object.entries(bySetup)
    .map(([s, rs]) => ({ s, n: rs.length, r: rs.reduce((a, x) => a + x, 0) }))
    .sort((a, b) => b.r - a.r);
  const best = setups[0];
  const worst = setups[setups.length - 1];

  const pct = (totalR / goal) * 100;
  const msg =
    `📅 RESUMEN DEL MES ${month}\n` +
    `━━━━━━━━━━━━━━━\n` +
    `R total: ${totalR >= 0 ? '+' : ''}${r1(totalR)}R  (meta ${goal}R → ${Math.round(pct)}%)\n` +
    `${totalR >= goal ? '🏆 ¡META ALCANZADA!' : totalR > 0 ? '📈 Mes en verde' : '📉 Mes en rojo'}\n` +
    `Trades: ${closed.length} (${wins.length} ganados / ${losses.length} perdidos)\n` +
    `Win Rate: ${Math.round(wr * 100)}%  ·  PF: ${pf ? r1(pf) : '—'}  ·  Expectativa: ${r1(exp)}R/trade\n` +
    (best ? `Mejor setup: ${best.s} (${best.n}t, ${best.r >= 0 ? '+' : ''}${r1(best.r)}R)\n` : '') +
    (worst && worst !== best ? `Peor setup: ${worst.s} (${worst.n}t, ${r1(worst.r)}R)` : '');

  console.log(msg);
  const sent = await new Telegram().send(msg);
  console.log(sent ? '\n(enviado a Telegram)' : '\n(Telegram no configurado)');
})().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});

'use strict';

/**
 * GESTOR ACTIVO de posiciones: en cada ciclo del autobot revisa las posiciones
 * ABIERTAS con dinero (grado A+/A/B) y la IA decide MANTENER o CERRAR YA.
 *
 * Sesgo por defecto: MANTENER (el runner del monitor es el que paga — validado en
 * backtest). La IA cierra solo con invalidación clara de la tesis.
 *
 * Control de cuota: cada trade se revisa como máximo cada `review_every_hours`
 * (campo lastReview en ideas-log) y máximo `max_per_cycle` por ciclo.
 *
 * Uso: node scripts/manage-trades.js
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Journal } = require('../src/core/journal');
const { Telegram } = require('../src/core/telegram');
const { AIEngine } = require('../src/core/ai');
const { computeIndicators } = require('../src/core/indicators');
const { resolveVault } = require('../src/core/brain');

const r2 = (x) => (x == null || Number.isNaN(x) ? null : Math.round(x * 100) / 100);

function loadConfig() {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '../config.json'), 'utf8'));
}

(async () => {
  const config = loadConfig();
  const mcfg = config.trade_management || {};
  if (mcfg.enabled === false) { console.log('Gestor: desactivado.'); return; }
  const REVIEW_H = mcfg.review_every_hours ?? 4;
  const MAX_CYCLE = mcfg.max_per_cycle ?? 5;

  const journal = new Journal(config);
  const tg = new Telegram();
  const ai = new AIEngine(config, process.env.OPENROUTER_API_KEY);
  const ex = require('../src/core/data-exchange').spotClient();
  const now = Date.now();

  // Solo posiciones con dinero (grado con asignación > 0) y sin revisión reciente.
  const gradeMult = config.paper?.sizing_by_grade || { 'A+': 1.5, A: 1.25, B: 1, C: 0 };
  const due = journal
    .readIdeas()
    .filter((i) => i.status === 'open' && (gradeMult[i.grade] ?? 1) > 0)
    .filter((i) => !i.lastReview || now - Date.parse(i.lastReview) >= REVIEW_H * 3600000)
    .sort((a, b) => (a.lastReview || a.date).localeCompare(b.lastReview || b.date))
    .slice(0, MAX_CYCLE);

  if (!due.length) { console.log('Gestor: nada que revisar este ciclo.'); return; }
  console.log(`Gestor: revisando ${due.length} posiciones abiertas...`);

  for (const t of due) {
    try {
      const rows = await ex.fetchOHLCV(t.symbol, '1h', undefined, 210);
      // computeIndicators espera arrays por campo, no filas crudas de ccxt.
      const ind = computeIndicators({
        time: rows.map((r) => r[0]), open: rows.map((r) => r[1]), high: rows.map((r) => r[2]),
        low: rows.map((r) => r[3]), close: rows.map((r) => r[4]), volume: rows.map((r) => r[5]),
      });
      const price = ind?.price ?? rows[rows.length - 1][4];
      const risk = Math.abs(t.entry - t.stop) || t.entry * 0.01;
      const dirSign = t.dir === 'long' ? 1 : -1;
      const rNow = r2((dirSign * (price - t.entry)) / risk);
      const hoursOpen = r2((now - Date.parse(t.date)) / 3600000);

      const verdict = await ai.manageTrade(t, {
        price,
        rNow,
        hoursOpen,
        indicators: ind
          ? { rsi: r2(ind.rsi), adx: r2(ind.adx), ema20: r2(ind.ema20), ema50: r2(ind.ema50), macdHist: ind.macdHist }
          : {},
      });

      if (verdict.decision === 'close') {
        const status = rNow > 0.05 ? 'win' : rNow < -0.05 ? 'loss' : 'breakeven';
        journal.closeIdea(t.id, status, rNow, price, 'ai-manager');
        const emoji = rNow > 0 ? '✅' : rNow < 0 ? '✂️' : '➖';
        const msg =
          `${emoji} CIERRE ANTICIPADO (gestor IA) ${t.dir.toUpperCase()} ${t.symbol}: ${rNow >= 0 ? '+' : ''}${rNow}R @ ${price}\n` +
          `Motivo: ${verdict.reason || '—'}`;
        console.log('  ' + msg.replace(/\n/g, ' | '));
        await tg.send(msg);
      } else {
        journal.updateIdea(t.id, { lastReview: new Date(now).toISOString() });
        console.log(`  mantener ${t.dir} ${t.symbol} (${rNow >= 0 ? '+' : ''}${rNow}R): ${verdict.reason || '—'}`);
      }
    } catch (e) {
      console.log(`  ${t.symbol}: gestor omitido (${e.message.slice(0, 80)})`);
    }
  }
})().catch((e) => {
  console.error('Gestor error:', e.message);
  process.exit(1);
});

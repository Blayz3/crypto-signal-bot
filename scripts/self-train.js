'use strict';

/**
 * AUTOENTRENAMIENTO mensual. El bot aprende de SUS PROPIOS resultados y se vuelve
 * más selectivo cada mes:
 *   1. Refresca el ranking mecánico de setups con datos frescos (setups-backtest).
 *   2. Mide el rendimiento REAL del mes por setup (del diario): qué ganó y qué perdió.
 *   3. Junta las lecciones de las pérdidas (autopsias).
 *   4. Escribe `00-principios/auto-entrenamiento.md` (siempre inyectada): PRIORIZA los
 *      setups ganadores, pone en CUARENTENA los perdedores, y SUBE el nivel de exigencia
 *      si el mes no fue rentable → con el tiempo deja solo los trades buenos.
 *   5. Avisa por Telegram lo que aprendió.
 *
 * Uso: node scripts/self-train.js [YYYY-MM]   (por defecto el mes anterior)
 */

const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const { promisify } = require('util');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Journal } = require('../src/core/journal');
const { Telegram } = require('../src/core/telegram');
const { resolveVault } = require('../src/core/brain');

const execFileP = promisify(execFile);
const ROOT = path.join(__dirname, '..');
const r1 = (x) => Math.round(x * 10) / 10;

function loadConfig() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf8'));
}

(async () => {
  const config = loadConfig();
  const goal = config.brain?.monthly_r_goal || 130;
  const vault = resolveVault(config.brain?.vault_path);
  const diaryDir = path.join(vault, 'diario');

  let month = process.argv[2];
  if (!month) {
    const d = new Date(Date.now());
    month = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1)).toISOString().slice(0, 7);
  }

  // 1) Refresca el ranking mecánico de setups con datos frescos.
  console.log('Refrescando ranking de setups (datos frescos)...');
  try {
    await execFileP('node', ['scripts/setups-backtest.js', '90'], { cwd: ROOT, timeout: 600000 });
  } catch (e) {
    console.log('  (backtest de setups omitido:', e.message + ')');
  }

  // 2) Rendimiento REAL del mes por setup.
  const journal = new Journal(config);
  const closed = journal
    .readEntries()
    .filter((e) => ['win', 'loss', 'breakeven'].includes(e.status) && (e.date || '').slice(0, 7) === month && !Number.isNaN(e.result_r));

  const bySetup = {};
  for (const e of closed) {
    const k = e.setup || 'sin-setup';
    (bySetup[k] = bySetup[k] || []).push(e.result_r);
  }
  const perf = Object.entries(bySetup).map(([s, rs]) => ({
    s, n: rs.length, total: rs.reduce((a, x) => a + x, 0),
    wr: rs.filter((x) => x > 0).length / rs.length,
  }));
  const winners = perf.filter((p) => p.n >= 3 && p.total > 0).sort((a, b) => b.total - a.total);
  const losers = perf.filter((p) => p.n >= 3 && p.total <= 0).sort((a, b) => a.total - b.total);
  const monthR = r1(closed.reduce((a, e) => a + e.result_r, 0));

  // 3) Lecciones de las pérdidas del mes (de las autopsias).
  const lessons = [];
  try {
    for (const f of fs.readdirSync(diaryDir)) {
      if (!f.endsWith('.md')) continue;
      const raw = fs.readFileSync(path.join(diaryDir, f), 'utf8');
      if (!/status:\s*loss/.test(raw)) continue;
      if (!new RegExp(`date:\\s*${month}`).test(raw)) continue;
      const m = raw.match(/\*\*Lección:\*\*\s*(.+)/);
      if (m && m[1].trim().length > 15) lessons.push(m[1].trim());
    }
  } catch { /* sin diario */ }
  const topLessons = [...new Set(lessons)].slice(0, 6);

  // 4) Nivel de exigencia (sube si el mes no fue rentable → más selectivo).
  const statePath = path.join(vault, '.train-state.json');
  let state = { level: 1, lastMonth: null };
  try { state = JSON.parse(fs.readFileSync(statePath, 'utf8')); } catch { /* primer mes */ }
  if (state.lastMonth !== month) {
    if (monthR < goal * 0.4) state.level = Math.min(5, state.level + 1); // poco rentable → más estricto
    else if (monthR >= goal) state.level = Math.max(1, state.level - 1); // cumplió → puede relajar
    state.lastMonth = month;
  }
  const minConfluence = 3 + Math.min(state.level - 1, 2); // 3..5 factores
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));

  // 5) Escribe la nota de autoentrenamiento (siempre inyectada).
  const date = new Date(Date.now()).toISOString().slice(0, 10);
  const note = `---
title: Autoentrenamiento (aprendido de mis resultados)
type: principio
tags: [autoentrenamiento, aprendizaje, seleccion, cuarentena, mejora]
bias: [long, short]
regime: [any]
timeframe: [any]
weight: high
---

# Autoentrenamiento (aprendido de mis resultados)

Generado el ${date} con los resultados REALES del mes ${month} (${closed.length} trades, ${monthR >= 0 ? '+' : ''}${monthR}R).
El bot se entrena solo: prioriza lo que gana, pone en cuarentena lo que pierde, y sube la
exigencia si no fue rentable. **Nivel de exigencia actual: ${state.level}/5.**

## ✅ Setups a PRIORIZAR (ganaron con datos reales)
${winners.length ? winners.map((p) => `- ${p.s}: ${p.n} trades, ${p.total >= 0 ? '+' : ''}${r1(p.total)}R, WR ${Math.round(p.wr * 100)}% → más confianza`).join('\n') : '- (aún sin setups ganadores con muestra suficiente — sigue recolectando)'}

## ⛔ Setups en CUARENTENA (perdieron — evítalos o exige confluencia extra)
${losers.length ? losers.map((p) => `- ${p.s}: ${p.n} trades, ${r1(p.total)}R → solo si confluencia ≥${minConfluence + 1}, si no NONE`).join('\n') : '- (ninguno con muestra suficiente este mes)'}

## 📝 Lecciones de las pérdidas del mes
${topLessons.length ? topLessons.map((l) => `- ${l}`).join('\n') : '- (sin lecciones registradas este mes)'}

**Regla para el bot:** Aplica lo aprendido de MIS resultados: prioriza los setups ganadores de arriba con más confianza; los de cuarentena solo con confluencia ≥${minConfluence + 1} o NONE. Exige confluencia mínima de ${minConfluence} factores en CUALQUIER trade (nivel de exigencia ${state.level}/5). El objetivo es subir la selectividad mes a mes hasta quedarme solo con trades buenos: ante la duda, NONE.

Relacionado: [[configuracion-optima]], [[setups-rendimiento]], [[lecciones-aprendidas]], [[confluencia]], [[meta-mensual]]
`;
  fs.writeFileSync(path.join(vault, '00-principios', 'auto-entrenamiento.md'), note);
  console.log(`\nAutoentrenamiento escrito. Nivel ${state.level}/5, confluencia mín ${minConfluence}.`);
  console.log(`Ganadores: ${winners.map((w) => w.s).join(', ') || '—'}`);
  console.log(`Cuarentena: ${losers.map((l) => l.s).join(', ') || '—'}`);

  // 6) Telegram.
  const msg =
    `🧠 AUTOENTRENAMIENTO ${month}\n` +
    `Resultado: ${monthR >= 0 ? '+' : ''}${monthR}R · Nivel de exigencia: ${state.level}/5 (confluencia mín ${minConfluence})\n` +
    `✅ Prioriza: ${winners.map((w) => w.s).slice(0, 3).join(', ') || '—'}\n` +
    `⛔ Cuarentena: ${losers.map((l) => l.s).slice(0, 3).join(', ') || '—'}\n` +
    `El bot está más selectivo este mes.`;
  await new Telegram().send(msg);
})().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});

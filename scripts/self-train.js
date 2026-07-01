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

function isoWeekKey(ms) {
  const t = new Date(ms);
  const d = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()));
  const dayNum = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dayNum + 3);
  const firstThu = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((d - firstThu) / 86400000 - 3 + ((firstThu.getUTCDay() + 6) % 7)) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

(async () => {
  const config = loadConfig();
  const monthlyGoal = config.brain?.monthly_r_goal || 130;
  const weeklyGoal = config.brain?.weekly_r_goal || Math.round(monthlyGoal / 4);
  const vault = resolveVault(config.brain?.vault_path);
  const diaryDir = path.join(vault, 'diario');

  // Ventana RODANTE de 7 días: el bot aprende y se AJUSTA CADA SEMANA (mejora rápido).
  const now = Date.now();
  const cutoff = now - 7 * 86400000;
  const weekKey = isoWeekKey(now);
  const periodLabel = `${new Date(cutoff).toISOString().slice(0, 10)} → ${new Date(now).toISOString().slice(0, 10)}`;

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
    .filter((e) => ['win', 'loss', 'breakeven'].includes(e.status) && e.date && Date.parse(e.date) >= cutoff && !Number.isNaN(e.result_r));

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
  const weekR = r1(closed.reduce((a, e) => a + e.result_r, 0));

  // 3) Lecciones de las pérdidas de la semana (de las autopsias).
  const lessons = [];
  try {
    for (const f of fs.readdirSync(diaryDir)) {
      if (!f.endsWith('.md')) continue;
      const raw = fs.readFileSync(path.join(diaryDir, f), 'utf8');
      if (!/status:\s*loss/.test(raw)) continue;
      const dm = raw.match(/^date:\s*(.+)$/m);
      if (!dm || Date.parse(dm[1].trim()) < cutoff) continue;
      const m = raw.match(/\*\*Lección:\*\*\s*(.+)/);
      if (m && m[1].trim().length > 15) lessons.push(m[1].trim());
    }
  } catch { /* sin diario */ }
  const topLessons = [...new Set(lessons)].slice(0, 6);

  // 4) Nivel de exigencia (sube si la semana no fue rentable → más selectivo).
  const statePath = path.join(vault, '.train-state.json');
  let state = { level: 1, lastWeek: null };
  try { state = JSON.parse(fs.readFileSync(statePath, 'utf8')); } catch { /* primera semana */ }
  if (state.lastWeek !== weekKey) {
    if (weekR < weeklyGoal * 0.4) state.level = Math.min(5, state.level + 1); // poco rentable → más estricto
    else if (weekR >= weeklyGoal) state.level = Math.max(1, state.level - 1); // cumplió → puede relajar
    state.lastWeek = weekKey;
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

Generado el ${date} con los resultados REALES de la SEMANA (${periodLabel}, ${closed.length} trades, ${weekR >= 0 ? '+' : ''}${weekR}R).
El bot se entrena solo CADA SEMANA: NO abandona los setups, los PERFECCIONA — prioriza lo que
gana, exige la condición que faltó en lo que pierde, y sube la exigencia si no fue rentable.
**Nivel de exigencia actual: ${state.level}/5.**

## ✅ Setups a PRIORIZAR (ganaron con datos reales)
${winners.length ? winners.map((p) => `- ${p.s}: ${p.n} trades, ${p.total >= 0 ? '+' : ''}${r1(p.total)}R, WR ${Math.round(p.wr * 100)}% → más confianza`).join('\n') : '- (aún sin setups ganadores con muestra suficiente — sigue recolectando)'}

## 🔧 Setups a AFINAR (perdieron — NO los abandones: exige la confluencia que faltó)
${losers.length ? losers.map((p) => `- ${p.s}: ${p.n} trades, ${r1(p.total)}R → tómalo solo con confluencia ≥${minConfluence + 1} (perfecciona la entrada), si no NONE`).join('\n') : '- (ninguno con muestra suficiente esta semana)'}

## 📝 Lecciones de las pérdidas de la semana
${topLessons.length ? topLessons.map((l) => `- ${l}`).join('\n') : '- (sin lecciones registradas esta semana)'}

**Regla para el bot:** Aplica lo aprendido de MIS resultados: prioriza los setups ganadores con más confianza; los que perdieron NO se abandonan — exígeles confluencia ≥${minConfluence + 1} y la condición que faltó según las lecciones. Confluencia mínima de ${minConfluence} factores en CUALQUIER trade (nivel de exigencia ${state.level}/5). Objetivo: PERFECCIONAR los setups semana a semana para perder menos de lo evitable; ante la duda, NONE.

Relacionado: [[configuracion-optima]], [[setups-rendimiento]], [[lecciones-aprendidas]], [[confluencia]], [[meta-mensual]]
`;
  fs.writeFileSync(path.join(vault, '00-principios', 'auto-entrenamiento.md'), note);
  console.log(`\nAutoentrenamiento escrito. Nivel ${state.level}/5, confluencia mín ${minConfluence}.`);
  console.log(`Ganadores: ${winners.map((w) => w.s).join(', ') || '—'}`);
  console.log(`Cuarentena: ${losers.map((l) => l.s).join(', ') || '—'}`);

  // 6) Telegram.
  const msg =
    `🧠 AUTOENTRENAMIENTO SEMANAL (${weekKey})\n` +
    `Resultado 7d: ${weekR >= 0 ? '+' : ''}${weekR}R (meta ${weeklyGoal}R) · Exigencia: ${state.level}/5 (confluencia mín ${minConfluence})\n` +
    `✅ Prioriza: ${winners.map((w) => w.s).slice(0, 3).join(', ') || '—'}\n` +
    `🔧 A afinar: ${losers.map((l) => l.s).slice(0, 3).join(', ') || '—'}\n` +
    `El bot perfeccionó sus setups esta semana.`;
  await new Telegram().send(msg);
})().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});

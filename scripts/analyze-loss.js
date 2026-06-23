'use strict';

/**
 * Autopsia de un trade PERDIDO: lee la entrada del diario, descarga lo que hizo el
 * precio tras la entrada, calcula hechos objetivos (cuándo tocó el stop, si se acercó
 * al target, MFE/MAE) y pide a la IA la CAUSA RAÍZ + una lección. La guarda en la nota.
 *
 * Uso: node scripts/analyze-loss.js <archivo-del-diario.md>
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const ccxt = require('ccxt');
const { AIEngine } = require('../src/core/ai');
const { Brain, parseFrontmatter, expandHome } = require('../src/core/brain');

function loadConfig() {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '../config.json'), 'utf8'));
}
const r2 = (x) => (x == null || Number.isNaN(x) ? null : Math.round(x * 100) / 100);

(async () => {
  const config = loadConfig();
  const arg = process.argv[2];
  if (!arg) throw new Error('Falta el archivo del diario.');
  const dir = path.join(expandHome(config.brain.vault_path), 'diario');
  const full = path.join(dir, path.basename(arg));
  let raw = fs.readFileSync(full, 'utf8');
  const fm = parseFrontmatter(raw) || {};
  const symbol = fm.symbol;
  const action = (fm.action || '').toLowerCase();
  const entry = parseFloat(fm.entry);
  const stop = parseFloat(fm.stop);
  const target = parseFloat(fm.target);
  const setup = fm.setup || '';
  const date = fm.date;
  const rationale = (raw.match(/\*\*Razón \(IA\):\*\*\s*(.+)/) || [])[1] || '';
  const long = action === 'long';
  const risk = Math.abs(entry - stop) || entry * 0.01;

  // --- Lo que hizo el precio tras la entrada ---
  let facts = 'No se pudo obtener la acción del precio.';
  try {
    const ex = new ccxt.binance({ enableRateLimit: true });
    const since = (Date.parse(date) || Date.now()) - 6 * 3600000;
    const o = await ex.fetchOHLCV(symbol, '1h', since, 200);
    const start = o.findIndex((c) => c[0] >= (Date.parse(date) || 0));
    const fwd = o.slice(start >= 0 ? start : 0);
    if (fwd.length) {
      let stopBar = -1;
      let mfe = 0; // máx avance a favor (en R) antes del stop
      for (let i = 0; i < fwd.length; i++) {
        const hi = fwd[i][2];
        const lo = fwd[i][3];
        const fav = long ? (hi - entry) / risk : (entry - lo) / risk;
        if (fav > mfe) mfe = fav;
        const hitStop = long ? lo <= stop : hi >= stop;
        if (hitStop) { stopBar = i; break; }
      }
      const hrs = stopBar >= 0 ? stopBar : fwd.length;
      facts =
        `Tras la entrada, el precio ${stopBar >= 0 ? `tocó el STOP en ~${hrs}h` : 'no tocó stop en la ventana'}. ` +
        `Máximo avance a favor antes del stop: +${r2(mfe)}R (target era ${target ? r2(Math.abs(target - entry) / risk) : '?'}R). ` +
        (mfe < 0.5
          ? 'Casi no se movió a favor: el precio fue en contra casi de inmediato (entrada en mal momento/contra-momentum).'
          : mfe >= 1.2
            ? 'Se acercó al target y luego revirtió hasta el stop (faltó asegurar parcial / mover stop a BE).'
            : 'Avance modesto y vuelta al stop (setup sin seguimiento o stop ajustado en zona de ruido).');
    }
  } catch (e) {
    facts += ` (${e.message})`;
  }

  // --- Autopsia con IA ---
  const ai = new AIEngine(config, process.env.OPENROUTER_API_KEY);
  const brain = new Brain(config).load();
  const brainCtx = brain.contextFor({ bias: action, regime: 'any', timeframe: '1h' });

  const system =
    'Eres un coach de trading. Te dan un trade que PERDIÓ. Encuentra la CAUSA RAÍZ del error y da ' +
    'una lección accionable. Sé concreto y breve (máx 2-3 frases). No repitas los datos; explica el PORQUÉ.';
  const user = `Trade perdido:
- ${symbol} ${action.toUpperCase()} | setup: ${setup}
- Entrada ${entry}, stop ${stop}, target ${target} (riesgo ${r2(risk)})
- Razón original de la entrada: ${rationale}

Acción del precio: ${facts}

Conocimiento del cerebro (reglas):
${brainCtx.split('\n').slice(0, 12).join('\n')}

¿Cuál fue la causa raíz de la pérdida y qué lección sacas? Responde directo: "Causa: ... Lección: ..."`;

  let lesson = '';
  try {
    lesson = await ai.analyze(system, user, 350);
  } catch (e) {
    lesson = `(No se pudo analizar con IA: ${e.message})`;
  }

  // --- Guardar la lección en la nota ---
  const oneLine = lesson.replace(/\n+/g, ' ').trim();
  if (/\*\*Lección:\*\*/.test(raw)) {
    raw = raw.replace(/\*\*Lección:\*\*.*/, `**Lección:** ${oneLine}`);
  } else {
    raw += `\n\n**Lección:** ${oneLine}\n`;
  }
  fs.writeFileSync(full, raw);
  process.stdout.write(JSON.stringify({ ok: true, lesson: oneLine }));
})().catch((e) => {
  process.stdout.write(JSON.stringify({ ok: false, error: e.message }));
});

'use strict';

/**
 * AUTO-MONITOR: por cada trade ABIERTO del diario, revisa la acción del precio desde
 * la entrada y decide si tocó el STOP (pérdida), el TARGET (ganancia) o agotó el tiempo.
 * Cierra el trade solo, notifica por Telegram y, en pérdida, dispara la autopsia
 * (analyze-loss) que escribe la lección → el bot aprende de sus errores automáticamente.
 *
 * Uso: node scripts/monitor.js   (pensado para cron cada ~10-15 min)
 */

const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const { promisify } = require('util');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const ccxt = require('ccxt');
const { Journal } = require('../src/core/journal');
const { Telegram } = require('../src/core/telegram');
const { parseFrontmatter, expandHome } = require('../src/core/brain');

const execFileP = promisify(execFile);
const MAX_HOLD_H = 72; // cierra por tiempo tras 72h
const r2 = (x) => (x == null || Number.isNaN(x) ? null : Math.round(x * 100) / 100);

function loadConfig() {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '../config.json'), 'utf8'));
}

/** Determina el resultado de un trade con la acción del precio desde la entrada. */
function outcome(candles, startIdx, action, entry, stop, target) {
  const long = action === 'long';
  const risk = Math.abs(entry - stop) || entry * 0.01;
  for (let i = startIdx; i < candles.length; i++) {
    const hi = candles[i][2];
    const lo = candles[i][3];
    const hitStop = long ? lo <= stop : hi >= stop;
    const hitTarget = long ? hi >= target : lo <= target;
    if (hitStop && hitTarget) return { status: 'loss', r: -1, exit: stop }; // conservador
    if (hitStop) return { status: 'loss', r: -1, exit: stop };
    if (hitTarget) return { status: 'win', r: r2(Math.abs(target - entry) / risk), exit: target };
    if ((i - startIdx) >= MAX_HOLD_H) {
      const close = candles[i][4];
      const move = long ? close - entry : entry - close;
      const r = r2(move / risk);
      return { status: r >= 0 ? 'breakeven' : 'loss', r, exit: close };
    }
  }
  return null; // sigue abierto
}

(async () => {
  const config = loadConfig();
  const journal = new Journal(config);
  const tg = new Telegram();
  const ex = require("../src/core/data-exchange").spotClient();
  const dir = path.join(expandHome(config.brain.vault_path), 'diario');

  const open = journal.readEntries().filter((e) => e.status === 'open');
  if (!open.length) {
    console.log('Sin trades abiertos que monitorear.');
    return;
  }
  console.log(`Monitoreando ${open.length} trades abiertos...`);

  let closed = 0;
  for (const e of open) {
    if (!e.symbol || !Number.isFinite(e.entry) || !Number.isFinite(e.stop) || !Number.isFinite(e.target) || !e.date) continue;
    let candles;
    try {
      const entryMs = Date.parse(e.date);
      candles = await ex.fetchOHLCV(e.symbol, '1h', entryMs - 2 * 3600000, 200);
    } catch (err) {
      console.log(`  ${e.symbol}: no se pudo traer precio (${err.message})`);
      continue;
    }
    const entryMs = Date.parse(e.date);
    const start = candles.findIndex((c) => c[0] >= entryMs);
    if (start === -1) continue; // aún no hay velas posteriores a la entrada → sigue abierto
    const res = outcome(candles, start, (e.action || '').toLowerCase(), e.entry, e.stop, e.target);
    if (!res) continue; // sigue abierto

    // Cierra el trade en la nota.
    const full = path.join(dir, e.file);
    let raw = fs.readFileSync(full, 'utf8');
    raw = raw.replace(/^status:.*$/m, `status: ${res.status}`);
    raw = raw.replace(/^result_r:.*$/m, `result_r: ${res.r}`);
    fs.writeFileSync(full, raw);
    closed++;

    const emoji = res.r > 0 ? '✅' : res.r < 0 ? '❌' : '➖';
    const msg = `${emoji} CERRADO ${e.symbol} ${(e.action || '').toUpperCase()}: ${res.r >= 0 ? '+' : ''}${res.r}R\nSetup: ${e.setup || '—'} · ${res.status}`;
    console.log('  ' + msg.replace(/\n/g, ' | '));
    await tg.send(msg);

    // Si perdió: autopsia automática → lección (el bot aprende).
    if (res.r < 0) {
      try {
        const { stdout } = await execFileP('node', [path.join(__dirname, 'analyze-loss.js'), e.file], {
          cwd: path.join(__dirname, '..'),
        });
        const out = JSON.parse(stdout || '{}');
        if (out.ok && out.lesson) {
          console.log('  📝 Lección:', out.lesson.slice(0, 120));
          await tg.send(`📝 Lección de ${e.symbol}: ${out.lesson}`);
        }
      } catch (err) {
        console.log('  (autopsia falló:', err.message + ')');
      }
    }
  }
  console.log(`Cerrados ${closed} trades.`);

  // --- RETROALIMENTACIÓN DE IDEAS: marca tp/sl/timeout de las ideas del digest ---
  const openIdeas = journal.readIdeas().filter((i) => i.status === 'open');
  let ideasClosed = 0;
  for (const it of openIdeas) {
    if (!it.symbol || !Number.isFinite(it.entry) || !Number.isFinite(it.stop) || !Number.isFinite(it.target) || !it.date) continue;
    let candles;
    try {
      const entryMs = Date.parse(it.date);
      candles = await ex.fetchOHLCV(it.symbol, '1h', entryMs - 2 * 3600000, 200);
    } catch {
      continue;
    }
    const start = candles.findIndex((c) => c[0] >= Date.parse(it.date));
    if (start === -1) continue; // aún sin velas posteriores a la entrada → sigue abierta
    const res = outcome(candles, start, (it.dir || '').toLowerCase(), it.entry, it.stop, it.target);
    if (!res) continue; // sigue abierta
    journal.closeIdea(it.id, res.status, res.r, res.exit);
    ideasClosed++;
  }
  if (openIdeas.length) console.log(`Ideas: ${ideasClosed}/${openIdeas.length} cerradas (retroalimentación).`);
})().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});

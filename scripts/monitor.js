'use strict';

/**
 * AUTO-MONITOR: por cada trade ABIERTO, revisa la acción del precio desde la entrada
 * y lo cierra SOLO cuando toca el STOP (pérdida) o el TARGET (ganancia). Sin límite de
 * tiempo: el trade queda abierto hasta que toque uno de los dos niveles.
 * Notifica por Telegram y, en pérdida, dispara la autopsia (analyze-loss) → aprende.
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
const { parseFrontmatter, resolveVault } = require('../src/core/brain');

const execFileP = promisify(execFile);
const r2 = (x) => (x == null || Number.isNaN(x) ? null : Math.round(x * 100) / 100);

function loadConfig() {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '../config.json'), 'utf8'));
}

/** Cuántas velas 1h pedir para cubrir desde la entrada hasta AHORA (sin dejar huecos). */
function candleLimit(entryMs) {
  const hours = Math.ceil((Date.now() - entryMs) / 3600000) + 3;
  return Math.min(1000, Math.max(50, hours));
}

/**
 * Cierra solo al tocar STOP o TP (sin timeout) — con GESTIÓN DE GANADOR (runner):
 * al tocar el TP toma PARCIAL del 50%, mueve el stop a break-even y deja correr la otra
 * mitad hacia TP2 (el doble de distancia). Es el plan del cerebro (parcial en 2R + runner):
 * los movimientos grandes son los que pagan el mes.
 *   - toca SL antes de TP            → -1R (pérdida normal)
 *   - toca TP y luego BE             → +0.5×tpR (parcial asegurado, resto en BE)
 *   - toca TP y luego TP2 (2×dist)   → +0.5×tpR + 0.5×2×tpR  (p.ej. 2R→+3R)
 * Devuelve además un `exit` equivalente para que el P&L en $ del paper sea exacto.
 */
function outcome(candles, startIdx, action, entry, stop, target) {
  const long = action === 'long';
  const dir = long ? 1 : -1;
  const risk = Math.abs(entry - stop) || entry * 0.01;
  const tpR = Math.abs(target - entry) / risk;
  const target2 = entry + dir * 2 * Math.abs(target - entry); // TP2 = doble de distancia
  const exitEq = (r) => r2(entry + dir * r * risk); // salida equivalente para el P&L en $
  let phase = 1; // 1 = buscando SL/TP · 2 = runner (parcial tomado, stop en BE)

  for (let i = startIdx; i < candles.length; i++) {
    const hi = candles[i][2];
    const lo = candles[i][3];
    if (phase === 1) {
      const hitStop = long ? lo <= stop : hi >= stop;
      const hitTarget = long ? hi >= target : lo <= target;
      if (hitStop) return { status: 'loss', r: -1, exit: stop }; // conservador si toca ambos
      if (hitTarget) { phase = 2; continue; } // parcial 50% en TP; el resto corre desde la sig. vela
    } else {
      const hitBE = long ? lo <= entry : hi >= entry;
      const hitTP2 = long ? hi >= target2 : lo <= target2;
      if (hitBE) { const r = r2(0.5 * tpR); return { status: 'win', r, exit: exitEq(r) }; } // conservador
      if (hitTP2) { const r = r2(0.5 * tpR + tpR); return { status: 'win', r, exit: exitEq(r) }; }
    }
  }
  // fase 2 sin resolver → sigue abierto (recompute determinista en el próximo ciclo)
  return null;
}

(async () => {
  const config = loadConfig();
  const journal = new Journal(config);
  const tg = new Telegram();
  const ex = require("../src/core/data-exchange").spotClient();
  const dir = path.join(resolveVault(config.brain.vault_path), 'diario');

  const open = journal.readEntries().filter((e) => e.status === 'open');
  // OJO: NO salir aquí si el diario está vacío — abajo hay que cerrar también las
  // IDEAS (paper trading), que son la mayoría (grado C no van al diario).
  console.log(`Monitoreando ${open.length} trades del diario...`);

  let closed = 0;
  for (const e of open) {
    if (!e.symbol || !Number.isFinite(e.entry) || !Number.isFinite(e.stop) || !Number.isFinite(e.target) || !e.date) continue;
    let candles;
    try {
      const entryMs = Date.parse(e.date);
      candles = await ex.fetchOHLCV(e.symbol, "1h", entryMs - 2 * 3600000, candleLimit(entryMs));
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

  // --- RETROALIMENTACIÓN DE IDEAS: cierra al tocar SL/TP las ideas del paper ---
  const openIdeas = journal.readIdeas().filter((i) => i.status === 'open');
  let ideasClosed = 0;
  for (const it of openIdeas) {
    if (!it.symbol || !Number.isFinite(it.entry) || !Number.isFinite(it.stop) || !Number.isFinite(it.target) || !it.date) continue;
    let candles;
    try {
      const entryMs = Date.parse(it.date);
      candles = await ex.fetchOHLCV(it.symbol, "1h", entryMs - 2 * 3600000, candleLimit(entryMs));
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

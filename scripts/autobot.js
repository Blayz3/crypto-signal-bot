'use strict';

/**
 * AUTOBOT — el ciclo autónomo 24/7 (pensado para cron cada ~10-15 min):
 *   1. MONITOR: revisa trades abiertos, cierra los resueltos, aprende de las pérdidas.
 *   2. SCAN: busca señales nuevas (con cerebro + datos + confluencia).
 *   3. REGISTRA las señales A+ (respetando límites por dirección) y las MANDA a Telegram.
 *
 * Todo con el CEREBRO incluido (config.brain.vault_path). El bot se vigila y mejora solo.
 *
 * Uso: node scripts/autobot.js
 */

const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const { promisify } = require('util');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { runScan, loadConfig } = require('../src/core/scanner');
const { Journal } = require('../src/core/journal');
const { Telegram } = require('../src/core/telegram');
const { resolveVault } = require('../src/core/brain');

const execFileP = promisify(execFile);
const ROOT = path.join(__dirname, '..');

(async () => {
  const config = loadConfig();
  const tg = new Telegram();
  const stamp = new Date(Date.now()).toISOString().slice(0, 16).replace('T', ' ');
  console.log(`\n=== AUTOBOT ${stamp} ===`);

  // 1) Monitorear trades abiertos (cierra + aprende).
  try {
    const { stdout } = await execFileP('node', [path.join(__dirname, 'monitor.js')], { cwd: ROOT, timeout: 180000 });
    process.stdout.write(stdout);
  } catch (e) {
    console.log('monitor:', e.message);
  }

  // Estado diario (compartido por el trade de NY y el envío de trades).
  const vault = resolveVault(config.brain?.vault_path);
  const statePath = path.join(vault, '.daily-state.json');
  const today = new Date(Date.now()).toISOString().slice(0, 10);
  let st = {};
  try { st = JSON.parse(fs.readFileSync(statePath, 'utf8')); } catch { /* primer día */ }
  if (st.date !== today) st = { date: today, sent: [] };

  // TRADE DE LA APERTURA DE NUEVA YORK (8 AM NY). Va dentro del autobot porque
  // este corre fiable cada 30 min (el cron de GitHub para ny-open se retrasa horas
  // y, cuando por fin corre, ya no son las 8 en NY → se lo saltaba). Aquí se evalúa
  // en cuanto el reloj de NY marca las 8, una sola vez al día.
  const nyHour =
    parseInt(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', hour12: false }).format(new Date(Date.now())), 10) % 24;
  if (nyHour === 8 && st.nyTradeDate !== today) {
    console.log('Apertura de NY (8h): ejecutando trade de BTC...');
    try {
      const { stdout } = await execFileP('node', [path.join(__dirname, 'ny-open-trade.js')], { cwd: ROOT, timeout: 180000 });
      process.stdout.write(stdout);
      st.nyTradeDate = today;
      fs.writeFileSync(statePath, JSON.stringify(st, null, 2));
      console.log('  trade de NY enviado.');
    } catch (e) {
      console.log('ny-open-trade:', e.message);
    }
  }

  // Horario de trabajo: el monitor corre siempre (cierra trades), pero solo se
  // ESCANEA dentro del horario activo (evita el mercado muerto de madrugada).
  const tz = config.work_timezone || 'America/Tegucigalpa';
  const [hStart, hEnd] = config.work_hours || [5, 21];
  const nowHour =
    parseInt(new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hour12: false }).format(new Date(Date.now())), 10) % 24;
  if (nowHour < hStart || nowHour >= hEnd) {
    console.log(`Fuera de horario (${nowHour}h en ${tz}; activo ${hStart}-${hEnd}h). Solo monitoreo, sin escaneo.`);
    return;
  }

  // 2) Escanear señales nuevas.
  let res;
  try {
    res = await runScan(config, {});
  } catch (e) {
    console.log('scan error:', e.message);
    await tg.send(`⚠️ Autobot: error en el escaneo (${e.message})`);
    return;
  }
  if (res.halted) {
    console.log('Operativa detenida:', res.halted);
    await tg.send(`⛔ Operativa detenida: ${res.halted}`);
    return;
  }

  // 3) ENVÍO DE TRADES (mínimo 4/día, repartidos por horas, sin tope superior).
  //    No es un "digest": cada trade se manda en cuanto aparece. Los A+/A (la IA los
  //    aprobó) se mandan siempre; si vamos por debajo del ritmo del día, se completa
  //    con los mejores disponibles hasta el piso de 4. Cada símbolo, una vez al día.
  const journal = new Journal(config);
  const target = config.funnel?.daily_target_signals || 4;
  const maxDir = config.funnel?.max_signals_per_direction || 2;
  const perScanCap = config.funnel?.max_signals_per_scan || 4;
  const sentSymbols = new Set((st.sent || []).map((x) => x.symbol));

  // Ritmo del día: el piso sube de ~1 a `target` conforme avanza la jornada
  // (así los trades caen repartidos, no 4 de golpe al inicio).
  const frac = Math.max(0, Math.min(1, (nowHour - hStart) / Math.max(1, hEnd - hStart)));
  const floorByNow = Math.max(1, Math.ceil(target * frac));

  const pool = (res.ideas || []).filter(
    (e) => !sentSymbols.has(e.symbol) && [e.entry, e.stop, e.target].every((v) => Number.isFinite(v))
  );

  const pick = [];
  const dirCount = { long: 0, short: 0 };
  const tryAdd = (e) => {
    if (pick.includes(e)) return false;
    if ((dirCount[e.dir] || 0) >= maxDir) return false; // anti-cluster por dirección/escaneo
    pick.push(e);
    dirCount[e.dir] = (dirCount[e.dir] || 0) + 1;
    return true;
  };
  for (const e of pool) if (e.grade === 'A+' || e.grade === 'A') tryAdd(e); // buenos: siempre
  for (const e of pool) { // completa hasta el piso del día con lo mejor restante (B/C)
    if (sentSymbols.size + pick.length >= floorByNow) break;
    tryAdd(e);
  }
  const toSend = pick.slice(0, perScanCap);

  console.log(`Trades: ${pool.length} disponibles · piso del día ${floorByNow} · ya enviados hoy ${sentSymbols.size} · este ciclo ${toSend.length}.`);

  for (const e of toSend) {
    await tg.send(tg.formatTrade(e));
    journal.logIdea(e); // guarda entrada/SL/TP para retroalimentación (el monitor lo cierra y aprende)
    if (e.grade === 'A+' || e.grade === 'A') journal.logSignal({ ...e, action: e.dir }); // trade real → diario/auto-aprendizaje
    st.sent.push({ symbol: e.symbol, dir: e.dir, grade: e.grade });
    console.log(`  enviado: [${e.grade}] ${e.dir} ${e.symbol}`);
  }
  fs.writeFileSync(statePath, JSON.stringify(st, null, 2));
  if (!toSend.length) console.log('Nada nuevo que enviar este ciclo.');
})().catch((e) => {
  console.error('Autobot error fatal:', e.message);
  process.exit(1);
});

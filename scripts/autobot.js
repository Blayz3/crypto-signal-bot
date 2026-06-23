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

  // Ordena por convicción y aplica el límite por dirección (anti-cluster).
  const maxDir = config.funnel.max_signals_per_direction || 99;
  const signals = (res.signals || []).sort(
    (a, b) => (b.confluence || 0) - (a.confluence || 0) || (b.confidence || 0) - (a.confidence || 0)
  );
  const count = { long: 0, short: 0 };
  const accepted = [];
  for (const s of signals) {
    if ((count[s.action] || 0) < maxDir) {
      accepted.push(s);
      count[s.action] = (count[s.action] || 0) + 1;
    }
  }

  console.log(`Señales: ${signals.length} encontradas, ${accepted.length} aceptadas (límite ${maxDir}/dirección).`);

  // 3) Registrar y notificar.
  const journal = new Journal(config);
  for (const s of accepted) {
    journal.logSignal(s);
    await tg.send('📊 NUEVA SEÑAL\n' + tg.formatSignal(s));
    console.log(`  registrada y enviada: ${s.action} ${s.symbol}`);
  }
  if (!accepted.length) console.log('Sin señales A+ este ciclo (esperar es correcto).');

  // 4) DIGEST DIARIO — una vez al día: las mejores ideas graduadas (objetivo ~N/día).
  //    No fuerza trades A+; muestra las mejores oportunidades que HAY, con nota de
  //    calidad. Las A+ siguen llegando en tiempo real arriba; esto garantiza que Ed
  //    siempre vea sus 4 mejores ideas del día y decida él.
  try {
    const vault = resolveVault(config.brain?.vault_path);
    const statePath = path.join(vault, '.daily-state.json');
    let st = {};
    try { st = JSON.parse(fs.readFileSync(statePath, 'utf8')); } catch { /* primer día */ }
    const today = new Date(Date.now()).toISOString().slice(0, 10);
    const target = config.funnel?.daily_target_signals || 4;
    const ideas = res.ideas || [];
    if (st.lastDigestDate !== today && ideas.length) {
      const lines = ideas.map((e, i) => `${i + 1}. ${tg.formatIdea(e)}`).join('\n');
      await tg.send(
        `🎯 TOP ${ideas.length} IDEAS DEL DÍA (${today})\n` +
        `Objetivo: ${target} trades/día. Graduadas por calidad: A+/A/B con plan, C para vigilar.\n` +
        `Ojo: forzar trades por cuota pierde plata — toma SOLO las que te convenzan.\n\n${lines}`
      );
      st.lastDigestDate = today;
      fs.writeFileSync(statePath, JSON.stringify(st, null, 2));
      console.log(`Digest diario enviado (${ideas.length} ideas).`);
    }
  } catch (e) {
    console.log('digest:', e.message);
  }
})().catch((e) => {
  console.error('Autobot error fatal:', e.message);
  process.exit(1);
});

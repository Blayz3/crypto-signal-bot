'use strict';

/**
 * Registra en el diario una señal que el usuario decidió TOMAR.
 * Recibe la señal como JSON en argv[2] (la pasa la app al pulsar "Tomado").
 *
 * Uso: node scripts/journal-add.js '{"symbol":"BTC/USDT","action":"long",...}'
 */

const path = require('path');
const { Journal } = require('../src/core/journal');

function loadConfig() {
  return JSON.parse(require('fs').readFileSync(path.join(__dirname, '../config.json'), 'utf8'));
}

try {
  const signal = JSON.parse(process.argv[2] || '{}');
  if (!signal.symbol || !signal.action) {
    throw new Error('Señal inválida (faltan symbol/action).');
  }
  const file = new Journal(loadConfig()).logSignal(signal);
  process.stdout.write(JSON.stringify({ ok: true, file: path.basename(file || '') }));
} catch (e) {
  process.stdout.write(JSON.stringify({ ok: false, error: e.message }));
}

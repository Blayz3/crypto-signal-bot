'use strict';

/**
 * Exporta el historial de señales del diario + estadísticas (WR, expectativa)
 * en JSON para la vista de historial de la app.
 *
 * Uso: node scripts/history.js --json
 */

const path = require('path');
const { Journal } = require('../src/core/journal');

function loadConfig() {
  return JSON.parse(require('fs').readFileSync(path.join(__dirname, '../config.json'), 'utf8'));
}

try {
  const journal = new Journal(loadConfig());
  const entries = journal.readEntries().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const stats = journal.stats();
  process.stdout.write(JSON.stringify({ stats, entries }));
} catch (e) {
  process.stdout.write(JSON.stringify({ error: e.message, entries: [], stats: {} }));
}

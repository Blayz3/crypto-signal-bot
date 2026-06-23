'use strict';

/**
 * Marca el resultado de un trade del diario.
 * Uso:
 *   node scripts/journal-result.js            → lista trades abiertos
 *   node scripts/journal-result.js <archivo> win 2.0
 *   node scripts/journal-result.js <archivo> loss -1
 *   node scripts/journal-result.js <archivo> breakeven 0
 */

const fs = require('fs');
const path = require('path');
const { expandHome } = require('../src/core/brain');

const config = require('../config.json');
const dir = path.join(expandHome(config.brain.vault_path), 'diario');

const [, , fileArg, status, resultR] = process.argv;

if (!fileArg) {
  const open = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .filter((f) => /status:\s*open/.test(fs.readFileSync(path.join(dir, f), 'utf8')));
  console.log('Trades ABIERTOS:');
  if (!open.length) console.log('  (ninguno)');
  for (const f of open) console.log('  ' + f);
  console.log('\nPara cerrar: node scripts/journal-result.js <archivo> win|loss|breakeven <R>');
  process.exit(0);
}

if (!['win', 'loss', 'breakeven'].includes(status)) {
  console.error('Estado inválido. Usa: win | loss | breakeven');
  process.exit(1);
}

const full = path.join(dir, path.basename(fileArg));
if (!fs.existsSync(full)) {
  console.error('No existe:', full);
  process.exit(1);
}

let raw = fs.readFileSync(full, 'utf8');
raw = raw.replace(/^status:.*$/m, `status: ${status}`);
raw = raw.replace(/^result_r:.*$/m, `result_r: ${resultR ?? ''}`);
fs.writeFileSync(full, raw);
console.log(`✅ ${path.basename(fileArg)} → ${status} (${resultR}R)`);

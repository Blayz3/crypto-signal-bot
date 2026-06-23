'use strict';
// Evalua los trades "open" del diario contra el precio real (1h, Binance):
// que toco primero, stop o target? Marca status y result_r en cada nota.
// Limit orders: si el precio nunca llego a la entrada, queda "open" (no filled).
const fs = require('fs');
const path = require('path');
const ccxt = require('ccxt');

const DIR = path.join(process.env.HOME, 'Desktop/cerebro-trading/diario');

function parseFM(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const out = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (kv) out[kv[1]] = kv[2].trim();
  }
  return out;
}

(async () => {
  const ex = require("../src/core/data-exchange").spotClient();
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.md'));
  for (const f of files) {
    const fp = path.join(DIR, f);
    let raw = fs.readFileSync(fp, 'utf8');
    const fm = parseFM(raw);
    if (!fm || fm.status !== 'open') continue;
    const symbol = fm.symbol;
    const action = fm.action;
    const entry = parseFloat(fm.entry), stop = parseFloat(fm.stop), target = parseFloat(fm.target);
    const rr = parseFloat(fm.rr) || 2;
    const isLimit = (fm.orderType || 'market') === 'limit';
    const since = Date.parse(fm.date);
    if (!symbol || !entry || !stop || !target || !since) { console.log(f, '-> datos incompletos'); continue; }

    const candles = await ex.fetchOHLCV(symbol, '1h', since, 1000);
    let filled = !isLimit;
    let status = null, resultR = null, note = '';
    for (const [ts, , high, low] of candles.slice(1)) {
      if (!filled) {
        if ((action === 'long' && low <= entry) || (action === 'short' && high >= entry)) filled = true;
        else continue;
      }
      const hitStop = action === 'long' ? low <= stop : high >= stop;
      const hitTarget = action === 'long' ? high >= target : low <= target;
      if (hitStop && hitTarget) { status = 'loss'; resultR = -1; note = 'stop y target en la misma vela 1h: se asume lo peor (loss)'; break; }
      if (hitStop) { status = 'loss'; resultR = -1; break; }
      if (hitTarget) { status = 'win'; resultR = rr; break; }
    }
    if (!filled) { console.log(f, '-> limit NO llenada aun'); continue; }
    if (!status) { console.log(f, '-> sigue viva (ni stop ni target)'); continue; }

    raw = raw.replace(/^status: open$/m, 'status: ' + status);
    raw = raw.replace(/^result_r:\s*$/m, 'result_r: ' + resultR);
    raw = raw.replace(/\*\*Resultado:\*\*.*$/m, '**Resultado:** ' + status.toUpperCase() + ' (' + (resultR > 0 ? '+' : '') + resultR + 'R)' + (note ? ' — ' + note : '') + ' [auto-evaluado contra precio real]');
    fs.writeFileSync(fp, raw);
    console.log(f, '->', status.toUpperCase(), resultR > 0 ? '+' + resultR + 'R' : resultR + 'R');
  }
  console.log('listo');
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });

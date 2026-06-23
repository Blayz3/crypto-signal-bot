'use strict';
/**
 * NY Open Trade — BTC/USDT — 8:10 AM hora de Nueva York
 *
 * Regla ESPECIAL: este es el ÚNICO trade que bypasea el filtro A+.
 * SIEMPRE genera una entrada. Lógica: fade contrarian al movimiento
 * de la apertura de NY (84% de las aperturas revierten dentro de la sesión).
 *
 * Dirección:
 *   - BTC abre SUBIENDO vs cierre anterior → entrada SHORT (reversión bajista)
 *   - BTC abre BAJANDO vs cierre anterior → entrada LONG (reversión alcista)
 *
 * Gestión (fija, no depende de IA):
 *   - Stop:   1.5× ATR (14)
 *   - BE:     +1R
 *   - Parcial: 2R (50%)
 *   - Runner:  3-4R trailing
 *
 * Uso: node scripts/ny-open-trade.js
 */

const path = require('path');
const fs   = require('fs');
const os   = require('os');
const { execSync } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Telegram } = require('../src/core/telegram');

let ccxt;
try { ccxt = require('ccxt'); }
catch (e) {
  console.error('[ny-open-trade] ccxt no instalado:', e.message);
  process.exit(1);
}

// ── Config ─────────────────────────────────────────────────────────────────
function loadConfig() {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '../config.json'), 'utf8'));
}
function expandHome(p) {
  return p.startsWith('~') ? path.join(os.homedir(), p.slice(1)) : p;
}
const round = (v, dp = 4) => (v == null || isNaN(v) ? null : Math.round(v * 10 ** dp) / 10 ** dp);

// ── Indicadores básicos ─────────────────────────────────────────────────────
function calcATR(candles, period = 14) {
  const trs = [];
  for (let i = 1; i < candles.length; i++) {
    const [, , h, l] = candles[i];
    const pc = candles[i - 1][4];
    trs.push(Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc)));
  }
  if (trs.length < period) return trs.reduce((a, b) => a + b, 0) / trs.length;
  const first = trs.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let atr = first;
  for (let i = period; i < trs.length; i++) {
    atr = (atr * (period - 1) + trs[i]) / period;
  }
  return atr;
}

// ── Notificación macOS ──────────────────────────────────────────────────────
function notify(title, body) {
  try {
    const msg = body.replace(/'/g, "'\\''");
    const ttl = title.replace(/'/g, "'\\''");
    execSync(`osascript -e 'display notification "${msg}" with title "${ttl}" sound name "Ping"'`);
  } catch (_) { /* non-fatal */ }
}

// ── Escritura en diario del cerebro ────────────────────────────────────────
function writeJournal(vault, entry) {
  const dir = path.join(vault, 'diario');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const ts  = new Date().toISOString().slice(0, 16).replace(':', '').replace('-', '').replace('-', '').replace('T', 'T');
  const stamp = new Date().toISOString().slice(0, 16); // 2026-06-12T08:10
  const fname = `${stamp.replace(':', '').replace(':', '')}-BTCUSDT-${entry.direction}.md`;
  const file  = path.join(dir, fname);

  const content = `---
symbol: BTCUSDT
direction: ${entry.direction}
entry_price: ${entry.entryPrice}
stop_loss: ${entry.stopLoss}
take_profit: ${entry.takeProfit}
take_profit_2: ${entry.takeProfit2}
risk_r: 1
rr: ${entry.rr}
confidence: 70
setup: ny-open-reversal
timeframe: 1h
status: open
result_r: null
session: NY
date: ${new Date().toISOString()}
note: "Trade automático NY Open 8:10 AM. Filtro A+ NO aplica en este trade."
---

# NY Open BTC — ${entry.direction.toUpperCase()} — ${stamp}

## Contexto
- BTC abrió la sesión NY ${entry.openDir === 'up' ? '**SUBIENDO**' : '**BAJANDO**'} (+${round(entry.openMove * 100, 2)}% vs cierre anterior)
- Sesgo contrarian: ${entry.openDir === 'up' ? 'reversión bajista esperada (84% de probabilidad histórica)' : 'reversión alcista esperada (82% de probabilidad histórica)'}
- ATR(14) 1h: ${round(entry.atr, 2)} USDT

## Niveles
| Nivel | Precio |
|---|---|
| Entrada | ${entry.entryPrice} |
| Stop Loss | ${entry.stopLoss} (1.5× ATR) |
| BE / Mover stop | +1R = ${entry.beLevel} |
| TP parcial (50%) | ${entry.takeProfit} (2R) |
| TP runner | ${entry.takeProfit2} (3-4R trailing) |

## Gestión
1. Entrada a precio de mercado (~${entry.entryPrice})
2. Stop en ${entry.stopLoss} (1.5× ATR = ${round(entry.atr * 1.5, 2)} pts)
3. Al llegar +1R → mover stop a BE
4. A 2R → cerrar 50% de la posición
5. Dejar runner con trailing hasta 3-4R

## Causa
Trade automático NY Open. BTC abrió ${entry.openDir === 'up' ? 'alcista' : 'bajista'} → entrada ${entry.direction} contrarian. Único trade que bypasea el filtro A+.

## Lección
(completar al cerrar)
`;

  fs.writeFileSync(file, content);
  return file;
}

// ── Main ────────────────────────────────────────────────────────────────────
(async () => {
  const LOG = path.join(__dirname, '../ny-open.log');
  const log = (...args) => {
    const line = `[${new Date().toISOString()}] ${args.join(' ')}\n`;
    process.stdout.write(line);
    fs.appendFileSync(LOG, line);
  };

  log('=== NY Open Trade — inicio ===');

  const config = loadConfig();
  const vault  = expandHome(config.brain?.vault_path || '~/Desktop/cerebro-trading');
  const symbol = 'BTC/USDT';

  // Descarga ~50 velas de 1h para tener ATR estable
  const ex = new ccxt.binance({ enableRateLimit: true });
  log(`Descargando velas 1h de ${symbol}...`);
  const candles = await ex.fetchOHLCV(symbol, '1h', undefined, 60);
  // candles: [[ts, open, high, low, close, vol], ...]

  if (candles.length < 20) {
    log('ERROR: datos insuficientes');
    process.exit(1);
  }

  const last  = candles[candles.length - 1]; // vela actual (puede ser incompleta)
  const prev  = candles[candles.length - 2]; // vela cerrada anterior

  const currentPrice = last[4]; // close más reciente
  const prevClose    = prev[4];
  const openMove     = (currentPrice - prevClose) / prevClose;
  const openDir      = currentPrice >= prevClose ? 'up' : 'down';

  log(`Precio actual: ${currentPrice} | Cierre anterior: ${prevClose} | Movimiento apertura: ${round(openMove * 100, 3)}% (${openDir})`);

  const atr      = calcATR(candles.slice(-20));
  const stopDist = atr * 1.5;

  // Contrarian: si abrió subiendo → SHORT; si bajó → LONG
  const direction = openDir === 'up' ? 'short' : 'long';
  const isLong    = direction === 'long';

  const entryPrice  = round(currentPrice, 2);
  const stopLoss    = round(isLong ? currentPrice - stopDist : currentPrice + stopDist, 2);
  const beLevel     = round(isLong ? currentPrice + stopDist : currentPrice - stopDist, 2);
  const takeProfit  = round(isLong ? currentPrice + stopDist * 2 : currentPrice - stopDist * 2, 2);
  const takeProfit2 = round(isLong ? currentPrice + stopDist * 3.5 : currentPrice - stopDist * 3.5, 2);
  const rr          = 2.0;

  log(`Dirección: ${direction.toUpperCase()} | Entry: ${entryPrice} | SL: ${stopLoss} | TP1: ${takeProfit} (2R) | TP2: ${takeProfit2} (3.5R)`);

  const entryData = {
    direction, openDir, openMove, atr, entryPrice,
    stopLoss, beLevel, takeProfit, takeProfit2, rr,
  };

  const file = writeJournal(vault, entryData);
  log(`Diario escrito: ${file}`);

  // Notificación en pantalla (Mac)
  const notifBody = `${direction.toUpperCase()} ${entryPrice} → SL ${stopLoss} · TP ${takeProfit} (2R) | Reversión ${openDir === 'up' ? '📉' : '📈'}`;
  notify('🕐 NY Open BTC 8:15 AM', notifBody);
  log(`Notificación enviada: ${notifBody}`);

  // Telegram (para la nube 24/7)
  const sent = await new Telegram().send(
    `🕐 NY OPEN — BTC (8:15 NY) · fade contrarian\n` +
    `${direction.toUpperCase()} @ ${entryPrice}\n` +
    `SL ${stopLoss} · TP1 ${takeProfit} (2R) · TP2 ${takeProfit2} (3.5R)\n` +
    `Apertura ${openDir === 'up' ? 'subiendo → SHORT' : 'bajando → LONG'} (84% revierten)`
  );
  log(`Telegram: ${sent ? 'enviado' : 'no configurado'}`);

  log('=== NY Open Trade — completado ===\n');
})().catch((e) => {
  const line = `[${new Date().toISOString()}] ERROR: ${e.message}\n`;
  fs.appendFileSync(path.join(__dirname, '../ny-open.log'), line);
  console.error(line);
  process.exit(1);
});

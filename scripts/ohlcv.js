'use strict';

/**
 * Exporta velas OHLCV de un símbolo/timeframe en JSON para el gráfico de la app.
 * Formato listo para TradingView Lightweight Charts (time en segundos UNIX).
 *
 * Uso: node scripts/ohlcv.js BTC/USDT 1h 200 --json
 */

const path = require('path');
const { ExchangeClient } = require('../src/core/exchange');

function loadConfig() {
  return JSON.parse(require('fs').readFileSync(path.join(__dirname, '../config.json'), 'utf8'));
}

(async () => {
  const symbol = (process.argv[2] || 'BTC/USDT').toUpperCase();
  const timeframe = process.argv[3] || '1h';
  const limit = parseInt(process.argv[4], 10) || 200;

  const config = loadConfig();
  const ex = new ExchangeClient(config);
  const o = await ex.fetchOHLCV(symbol, timeframe, limit);

  const candles = o.time.map((t, i) => ({
    time: Math.floor(t / 1000), // ms -> s
    open: o.open[i],
    high: o.high[i],
    low: o.low[i],
    close: o.close[i],
    volume: o.volume[i],
  }));

  process.stdout.write(JSON.stringify({ symbol, timeframe, candles }));
})().catch((e) => {
  process.stdout.write(JSON.stringify({ error: e.message, candles: [] }));
  process.exit(0);
});

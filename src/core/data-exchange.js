'use strict';

const ccxt = require('ccxt');
const fs = require('fs');
const path = require('path');

/**
 * Fábrica única del cliente de datos de mercado.
 *
 * Binance bloquea las IPs de la nube (GitHub Actions devuelve HTTP 451
 * "restricted location"), así que el exchange de DATOS se lee de config.json
 * y por defecto usa uno alcanzable desde la nube. Para cambiarlo basta editar
 * "exchange" en config.json y re-correr — sin tocar código.
 *
 * Funciona igual local (Mac) y en la nube.
 */
function exchangeId() {
  try {
    const c = JSON.parse(fs.readFileSync(path.join(__dirname, '../../config.json'), 'utf8'));
    return c.exchange || 'bybit';
  } catch {
    return 'bybit';
  }
}

function spotClient() {
  const id = exchangeId();
  return new ccxt[id]({ enableRateLimit: true });
}

function swapClient() {
  const id = exchangeId();
  return new ccxt[id]({ enableRateLimit: true, options: { defaultType: 'swap' } });
}

module.exports = { exchangeId, spotClient, swapClient };

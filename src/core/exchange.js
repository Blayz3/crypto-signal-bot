'use strict';

const STABLE_BASES = new Set(['USDC', 'USDT', 'FDUSD', 'TUSD', 'DAI', 'USD1', 'USDE', 'USDP', 'BUSD', 'RLUSD', 'USDS', 'USDD', 'GUSD', 'EURT', 'PYUSD', 'EUR', 'EURI', 'XAUT', 'PAXG', 'WBTC', 'WBETH']);

const ccxt = require('ccxt');

/**
 * Capa de acceso al exchange vía ccxt.
 * Trae velas OHLCV y resuelve la lista de mercados a escanear.
 */
class ExchangeClient {
  constructor(config) {
    this.config = config;
    const ExchangeClass = ccxt[config.exchange];
    if (!ExchangeClass) {
      throw new Error(`Exchange no soportado por ccxt: ${config.exchange}`);
    }
    this.ex = new ExchangeClass({
      enableRateLimit: true,
      options: {
        defaultType: config.market_type === 'futures' ? 'swap' : 'spot',
      },
    });
    this._marketsLoaded = false;
  }

  async loadMarkets() {
    if (!this._marketsLoaded) {
      await this.ex.loadMarkets();
      this._marketsLoaded = true;
    }
    return this.ex.markets;
  }

  /**
   * Devuelve la lista final de símbolos a escanear.
   * - Si hay watchlist en config, usa esa (normalizada a SÍMBOLO/QUOTE).
   * - Si no, usa el top N por volumen en quote (ej. USDT).
   */
  async resolveSymbols() {
    await this.loadMarkets();
    const quote = this.config.quote || 'USDT';

    const wl = this.config.watchlist || [];
    if (wl.length > 0) {
      return wl
        .map((s) => this._normalizeSymbol(s, quote))
        .filter((s) => this.ex.markets[s]);
    }

    return this._topByVolume(quote, this.config.auto_top_volume || 50);
  }

  _normalizeSymbol(raw, quote) {
    let s = raw.trim().toUpperCase();
    if (s.includes('/')) return s;
    // "BTCUSDT" -> "BTC/USDT", "BTC" -> "BTC/USDT"
    if (s.endsWith(quote)) {
      const base = s.slice(0, -quote.length);
      return `${base}/${quote}`;
    }
    return `${s}/${quote}`;
  }

  async _topByVolume(quote, n) {
    let tickers;
    try {
      tickers = await this.ex.fetchTickers();
    } catch (e) {
      throw new Error(`No se pudieron traer tickers: ${e.message}`);
    }
    // FILTRO DE CALIDAD: los listings nuevos inflan volumen 1-2 días y se cuelan al top
    // (SIREN/RAVE/etc. concentraron las pérdidas). Piso de volumen REAL en USD + fuera
    // tokens apalancados. Con el piso, el ranking queda dominado por majors líquidas.
    const minQuoteVol = this.config.min_quote_volume_usd ?? 10000000; // $10M/24h
    const LEVERAGED = /(3L|3S|2L|2S|5L|5S|UP|DOWN)$/;
    const rows = Object.values(tickers)
      .filter((t) => t.symbol && t.symbol.endsWith(`/${quote}`))
      .filter((t) => !STABLE_BASES.has((t.symbol.split('/')[0] || '').toUpperCase()))
      .filter((t) => !LEVERAGED.test(t.symbol.split('/')[0] || ''))
      .filter((t) => {
        const m = this.ex.markets[t.symbol];
        return m && m.active && m.spot !== false;
      })
      .map((t) => ({
        symbol: t.symbol,
        quoteVolume: t.quoteVolume || (t.baseVolume || 0) * (t.last || 0),
      }))
      .filter((r) => r.quoteVolume >= minQuoteVol)
      .sort((a, b) => b.quoteVolume - a.quoteVolume);

    // FILTRO DE MADUREZ: fuera listings nuevos (los pumps les inflan el volumen real).
    // La moneda debe tener >= min_listing_age_days de historia en el exchange.
    const minAgeDays = this.config.min_listing_age_days ?? 120;
    const cutoff = Date.now() - minAgeDays * 86400000;
    const out = [];
    for (const r of rows) {
      if (out.length >= n) break;
      try {
        const first = await this.ex.fetchOHLCV(r.symbol, '1d', cutoff - 30 * 86400000, 1);
        if (first.length && first[0][0] <= cutoff) out.push(r.symbol);
      } catch {
        out.push(r.symbol); // si la consulta falla, no bloquear (fail-open)
      }
    }
    return out;
  }

  /**
   * Trae OHLCV para un símbolo y timeframe.
   * Devuelve { open[], high[], low[], close[], volume[], time[] }.
   */
  async fetchOHLCV(symbol, timeframe, limit) {
    const raw = await this.ex.fetchOHLCV(symbol, timeframe, undefined, limit);
    const out = { time: [], open: [], high: [], low: [], close: [], volume: [] };
    for (const [t, o, h, l, c, v] of raw) {
      out.time.push(t);
      out.open.push(o);
      out.high.push(h);
      out.low.push(l);
      out.close.push(c);
      out.volume.push(v);
    }
    return out;
  }
}

module.exports = { ExchangeClient };

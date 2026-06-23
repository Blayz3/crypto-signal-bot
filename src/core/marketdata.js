'use strict';

const ccxt = require('ccxt');

/**
 * Reúne "edge" de mercado PÚBLICO (legal) para alimentar las decisiones:
 *  - CoinGecko: mercado global, dominancia BTC.
 *  - Fear & Greed (alternative.me): sentimiento.
 *  - Funding rate / Open Interest (exchange): posicionamiento de apalancados.
 *  - Flujo de ballenas: trades grandes y desbalance comprador/vendedor (proxy on-chain).
 *  - Noticias: RSS (sin llave) o CryptoPanic (con llave gratis).
 *  - Whale Alert: opcional con llave.
 *
 * Todo con degradación elegante: si una fuente falla o falta su llave, se omite.
 */
class MarketData {
  constructor(config) {
    this.cfg = (config && config.marketdata) || {};
    this.enabled = this.cfg.enabled !== false;
    this.whaleUsd = this.cfg.whale_trade_usd || 50000;
    this.cryptopanicKey = process.env.CRYPTOPANIC_API_KEY || '';
    this.whaleAlertKey = process.env.WHALE_ALERT_API_KEY || '';
    this._fut = new ccxt.binance({ enableRateLimit: true, options: { defaultType: 'swap' } });
    this._spot = new ccxt.binance({ enableRateLimit: true });
  }

  async _json(url, opts) {
    const res = await fetch(url, opts);
    if (!res.ok) throw new Error(`${res.status}`);
    return res.json();
  }

  // --- Contexto global (una vez por escaneo) ---

  async fearGreed() {
    const j = await this._json('https://api.alternative.me/fng/');
    const d = j.data[0];
    return { value: Number(d.value), label: d.value_classification };
  }

  async coingeckoGlobal() {
    const j = await this._json('https://api.coingecko.com/api/v3/global');
    return {
      mcapChange24h: j.data.market_cap_change_percentage_24h_usd,
      btcDominance: j.data.market_cap_percentage.btc,
    };
  }

  async news(limit = 4) {
    if (this.cryptopanicKey) {
      try {
        const j = await this._json(
          `https://cryptopanic.com/api/v1/posts/?auth_token=${this.cryptopanicKey}&public=true&kind=news`
        );
        return (j.results || []).slice(0, limit).map((p) => ({
          title: p.title,
          sentiment: p.votes ? (p.votes.positive - p.votes.negative) : 0,
        }));
      } catch {
        /* cae a RSS */
      }
    }
    // RSS sin llave (Cointelegraph).
    const xml = await (await fetch('https://cointelegraph.com/rss')).text();
    const titles = [...xml.matchAll(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/g)]
      .map((m) => m[1].trim())
      .filter((t) => t && !/Cointelegraph/i.test(t));
    return titles.slice(0, limit).map((title) => ({ title, sentiment: null }));
  }

  async whaleAlert() {
    if (!this.whaleAlertKey) return null;
    try {
      const j = await this._json(
        `https://api.whale-alert.io/v1/transactions?api_key=${this.whaleAlertKey}&min_value=1000000`
      );
      return (j.transactions || []).slice(0, 5).map((t) => ({
        amount: t.amount_usd,
        symbol: t.symbol,
        from: t.from?.owner_type,
        to: t.to?.owner_type,
      }));
    } catch {
      return null;
    }
  }

  async globalContext() {
    const [fg, cg, news, wa] = await Promise.allSettled([
      this.fearGreed(),
      this.coingeckoGlobal(),
      this.news(),
      this.whaleAlert(),
    ]);
    return {
      fearGreed: fg.status === 'fulfilled' ? fg.value : null,
      coingecko: cg.status === 'fulfilled' ? cg.value : null,
      news: news.status === 'fulfilled' ? news.value : [],
      whaleAlert: wa.status === 'fulfilled' ? wa.value : null,
    };
  }

  // --- Contexto por símbolo (por candidato) ---

  _futSymbol(symbol) {
    // "BTC/USDT" -> "BTC/USDT:USDT" (perp lineal en ccxt)
    return symbol.includes(':') ? symbol : `${symbol}:${symbol.split('/')[1]}`;
  }

  async funding(symbol) {
    const fr = await this._fut.fetchFundingRate(this._futSymbol(symbol));
    return { rate: fr.fundingRate, ratePct: fr.fundingRate != null ? fr.fundingRate * 100 : null };
  }

  async openInterest(symbol) {
    try {
      const oi = await this._fut.fetchOpenInterest(this._futSymbol(symbol));
      return { value: oi.openInterestValue || oi.openInterestAmount || null };
    } catch {
      return null;
    }
  }

  /** Trades grandes recientes y desbalance comprador/vendedor (proxy de ballenas). */
  async whaleFlow(symbol) {
    const trades = await this._spot.fetchTrades(symbol, undefined, 200);
    let buy = 0;
    let sell = 0;
    let bigCount = 0;
    let bigBuy = 0;
    let bigSell = 0;
    for (const t of trades) {
      const cost = t.cost || (t.amount || 0) * (t.price || 0);
      if (t.side === 'buy') buy += cost;
      else sell += cost;
      if (cost >= this.whaleUsd) {
        bigCount++;
        if (t.side === 'buy') bigBuy += cost;
        else bigSell += cost;
      }
    }
    const total = buy + sell || 1;
    return {
      buyPct: (buy / total) * 100,
      sellPct: (sell / total) * 100,
      bigTrades: bigCount,
      bigBias: bigBuy === bigSell ? 'neutral' : bigBuy > bigSell ? 'comprador' : 'vendedor',
    };
  }

  /**
   * Volume Profile: distribuye el volumen de cada vela por su rango de precio,
   * y calcula POC (precio de mayor volumen), VAH/VAL (área de valor ~70%).
   */
  async volumeProfile(symbol, tf = '1h', limit = 200, bins = 48) {
    const ohlcv = await this._spot.fetchOHLCV(symbol, tf, undefined, limit);
    if (!ohlcv.length) return null;
    let hi = -Infinity;
    let lo = Infinity;
    for (const c of ohlcv) {
      if (c[2] > hi) hi = c[2];
      if (c[3] < lo) lo = c[3];
    }
    const binSize = (hi - lo) / bins || 1;
    const vol = new Array(bins).fill(0);
    for (const c of ohlcv) {
      const lb = Math.max(0, Math.floor((c[3] - lo) / binSize));
      const hb = Math.min(bins - 1, Math.floor((c[2] - lo) / binSize));
      const span = Math.max(1, hb - lb + 1);
      for (let b = lb; b <= hb; b++) vol[b] += (c[5] || 0) / span;
    }
    let poc = 0;
    for (let b = 1; b < bins; b++) if (vol[b] > vol[poc]) poc = b;
    const total = vol.reduce((a, x) => a + x, 0) || 1;
    let inc = vol[poc];
    let lb = poc;
    let hb = poc;
    while (inc < total * 0.7 && (lb > 0 || hb < bins - 1)) {
      const below = lb > 0 ? vol[lb - 1] : -1;
      const above = hb < bins - 1 ? vol[hb + 1] : -1;
      if (above >= below) { hb++; inc += vol[hb]; } else { lb--; inc += vol[lb]; }
    }
    const r = (x) => Math.round(x * 100) / 100;
    return {
      poc: r(lo + (poc + 0.5) * binSize),
      vah: r(lo + (hb + 1) * binSize),
      val: r(lo + lb * binSize),
      price: r(ohlcv[ohlcv.length - 1][4]),
    };
  }

  /**
   * Naked POCs (nPOC): POC de cada día previo que el precio AÚN no ha vuelto a tocar.
   * Son imanes/targets. Devuelve el nPOC virgen más cercano arriba y abajo del precio.
   */
  async nakedPOCs(symbol, lookbackDays = 12) {
    const ohlcv = await this._spot.fetchOHLCV(symbol, '1h', undefined, lookbackDays * 24 + 6);
    if (ohlcv.length < 30) return null;
    const byDay = {};
    for (const c of ohlcv) {
      const d = Math.floor(c[0] / 86400000);
      (byDay[d] = byDay[d] || []).push(c);
    }
    const days = Object.keys(byDay).map(Number).sort((a, b) => a - b);
    const pocs = [];
    for (let i = 0; i < days.length - 1; i++) {
      // excluye el día actual (incompleto)
      const cs = byDay[days[i]];
      let hi = -Infinity;
      let lo = Infinity;
      for (const c of cs) {
        if (c[2] > hi) hi = c[2];
        if (c[3] < lo) lo = c[3];
      }
      const bins = 24;
      const bs = (hi - lo) / bins || 1;
      const vol = new Array(bins).fill(0);
      for (const c of cs) {
        const lb = Math.max(0, Math.floor((c[3] - lo) / bs));
        const hb = Math.min(bins - 1, Math.floor((c[2] - lo) / bs));
        const span = Math.max(1, hb - lb + 1);
        for (let b = lb; b <= hb; b++) vol[b] += (c[5] || 0) / span;
      }
      let p = 0;
      for (let b = 1; b < bins; b++) if (vol[b] > vol[p]) p = b;
      pocs.push({ day: days[i], poc: lo + (p + 0.5) * bs });
    }
    const price = ohlcv[ohlcv.length - 1][4];
    const naked = [];
    for (const pc of pocs) {
      let revisited = false;
      for (const c of ohlcv) {
        if (c[0] > (pc.day + 1) * 86400000 && c[3] <= pc.poc && c[2] >= pc.poc) {
          revisited = true;
          break;
        }
      }
      if (!revisited) naked.push(pc.poc);
    }
    const r = (x) => (x == null ? null : Math.round(x * 100) / 100);
    return {
      above: r(naked.filter((x) => x > price).sort((a, b) => a - b)[0]),
      below: r(naked.filter((x) => x < price).sort((a, b) => b - a)[0]),
      price: r(price),
    };
  }

  async symbolContext(symbol) {
    const [fund, oi, whale, vp, npoc] = await Promise.allSettled([
      this.funding(symbol),
      this.openInterest(symbol),
      this.whaleFlow(symbol),
      this.volumeProfile(symbol),
      this.nakedPOCs(symbol),
    ]);
    return {
      funding: fund.status === 'fulfilled' ? fund.value : null,
      openInterest: oi.status === 'fulfilled' ? oi.value : null,
      whale: whale.status === 'fulfilled' ? whale.value : null,
      volumeProfile: vp.status === 'fulfilled' ? vp.value : null,
      nakedPOCs: npoc.status === 'fulfilled' ? npoc.value : null,
    };
  }

  /** Bloque de texto compacto para inyectar en el prompt de la IA. */
  formatContext(global, sym) {
    const L = [];
    L.push('DATOS DE MERCADO EN VIVO (úsalos según el cerebro):');
    if (global?.fearGreed)
      L.push(`- Sentimiento Fear&Greed: ${global.fearGreed.value} (${global.fearGreed.label}).`);
    if (global?.coingecko)
      L.push(
        `- Mercado global: mcap ${fmtPct(global.coingecko.mcapChange24h)} 24h, dominancia BTC ${global.coingecko.btcDominance?.toFixed(1)}%.`
      );
    if (sym?.funding?.ratePct != null)
      L.push(
        `- Funding ${sym.funding.ratePct.toFixed(4)}% (${fundingRead(sym.funding.ratePct)}).`
      );
    if (sym?.whale)
      L.push(
        `- Flujo de ballenas: compras ${sym.whale.buyPct.toFixed(0)}% / ventas ${sym.whale.sellPct.toFixed(0)}%, ${sym.whale.bigTrades} trades grandes (sesgo ${sym.whale.bigBias}).`
      );
    if (sym?.volumeProfile) {
      const v = sym.volumeProfile;
      const loc =
        v.price > v.vah ? 'sobre el VAH (desbalance alcista)' :
        v.price < v.val ? 'bajo el VAL (desbalance bajista)' :
        'dentro del área de valor (rango)';
      L.push(`- Volume Profile: POC ${v.poc} (imán) · VAH ${v.vah} · VAL ${v.val}. Precio ${loc}.`);
    }
    if (sym?.nakedPOCs && (sym.nakedPOCs.above || sym.nakedPOCs.below)) {
      const np = sym.nakedPOCs;
      const parts = [];
      if (np.above) parts.push(`arriba ${np.above}`);
      if (np.below) parts.push(`abajo ${np.below}`);
      L.push(`- nPOC vírgenes (imanes/targets): ${parts.join(' · ')}.`);
    }
    if (global?.news?.length) {
      const heads = global.news.slice(0, 3).map((n) => `"${n.title}"`).join(' · ');
      L.push(`- Noticias: ${heads}.`);
    }
    if (global?.whaleAlert?.length) {
      const moves = global.whaleAlert
        .slice(0, 3)
        .map((w) => {
          const dir =
            w.to === 'exchange'
              ? 'a exchange (posible venta)'
              : w.from === 'exchange'
                ? 'sale de exchange (acumulación)'
                : 'entre wallets';
          return `$${Math.round((w.amount || 0) / 1e6)}M ${w.symbol || ''} ${dir}`;
        })
        .join(' · ');
      L.push(`- Ballenas on-chain (Whale Alert): ${moves}.`);
    }
    return L.length > 1 ? L.join('\n') : '';
  }
}

function fmtPct(v) {
  if (v == null) return '—';
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
}

function fundingRead(pct) {
  if (pct > 0.05) return 'longs sobre-apalancados, riesgo de long squeeze';
  if (pct < -0.05) return 'shorts sobre-apalancados, riesgo de short squeeze';
  return 'equilibrado';
}

module.exports = { MarketData };

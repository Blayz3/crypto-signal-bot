'use strict';

const { RSI, EMA, MACD, BollingerBands, ATR, ADX } = require('technicalindicators');

const last = (arr) => (arr.length ? arr[arr.length - 1] : undefined);
const prev = (arr) => (arr.length > 1 ? arr[arr.length - 2] : undefined);

/**
 * Calcula un set de indicadores sobre una serie OHLCV.
 * Devuelve los valores más recientes + algo de contexto previo.
 */
function computeIndicators(ohlcv) {
  const { high, low, close } = ohlcv;
  if (close.length < 60) return null;

  const rsi = RSI.calculate({ values: close, period: 14 });
  const ema20 = EMA.calculate({ values: close, period: 20 });
  const ema50 = EMA.calculate({ values: close, period: 50 });
  const ema200 = EMA.calculate({ values: close, period: 200 });
  const macd = MACD.calculate({
    values: close,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignalLine: false,
  });
  const bb = BollingerBands.calculate({ values: close, period: 20, stdDev: 2 });
  const atr = ATR.calculate({ high, low, close, period: 14 });
  const adx = ADX.calculate({ high, low, close, period: 14 });

  const price = last(close);
  const macdLast = last(macd) || {};
  const macdPrev = prev(macd) || {};
  const bbLast = last(bb) || {};

  return {
    price,
    rsi: last(rsi),
    rsiPrev: prev(rsi),
    ema20: last(ema20),
    ema50: last(ema50),
    ema200: last(ema200),
    macd: macdLast.MACD,
    macdSignal: macdLast.signal,
    macdHist: macdLast.histogram,
    macdHistPrev: macdPrev.histogram,
    bbUpper: bbLast.upper,
    bbMiddle: bbLast.middle,
    bbLower: bbLast.lower,
    atr: last(atr),
    adx: (last(adx) || {}).adx,
  };
}

/**
 * Puntuación local de confluencia. Positivo = sesgo long, negativo = short.
 * El valor absoluto es la "fuerza" de la señal; lo usamos para rankear
 * antes de gastar llamadas de IA.
 */
function scoreSignal(ind) {
  if (!ind) return { score: 0, bias: 'neutral', reasons: [] };
  let score = 0;
  const reasons = [];

  // Tendencia por EMAs
  if (ind.ema20 > ind.ema50 && ind.ema50 > ind.ema200) {
    score += 1.5;
    reasons.push('EMAs alineadas alcistas (20>50>200)');
  } else if (ind.ema20 < ind.ema50 && ind.ema50 < ind.ema200) {
    score -= 1.5;
    reasons.push('EMAs alineadas bajistas (20<50<200)');
  }

  // Precio vs EMA200
  if (ind.price > ind.ema200) {
    score += 0.5;
  } else {
    score -= 0.5;
  }

  // RSI
  if (ind.rsi < 30) {
    score += 1.0;
    reasons.push(`RSI sobreventa (${ind.rsi.toFixed(1)})`);
  } else if (ind.rsi > 70) {
    score -= 1.0;
    reasons.push(`RSI sobrecompra (${ind.rsi.toFixed(1)})`);
  } else if (ind.rsi > 50 && ind.rsiPrev <= 50) {
    score += 0.5;
    reasons.push('RSI cruzó 50 al alza');
  } else if (ind.rsi < 50 && ind.rsiPrev >= 50) {
    score -= 0.5;
    reasons.push('RSI cruzó 50 a la baja');
  }

  // MACD: cruce / momentum del histograma
  if (ind.macdHist > 0 && ind.macdHistPrev <= 0) {
    score += 1.0;
    reasons.push('MACD cruce alcista');
  } else if (ind.macdHist < 0 && ind.macdHistPrev >= 0) {
    score -= 1.0;
    reasons.push('MACD cruce bajista');
  } else if (ind.macdHist > ind.macdHistPrev) {
    score += 0.3;
  } else if (ind.macdHist < ind.macdHistPrev) {
    score -= 0.3;
  }

  // Bollinger: toques de banda
  if (ind.price <= ind.bbLower) {
    score += 0.7;
    reasons.push('Precio en banda inferior de Bollinger');
  } else if (ind.price >= ind.bbUpper) {
    score -= 0.7;
    reasons.push('Precio en banda superior de Bollinger');
  }

  // ADX como multiplicador de convicción (tendencia fuerte)
  if (ind.adx && ind.adx > 25) {
    score *= 1.15;
    reasons.push(`ADX fuerte (${ind.adx.toFixed(1)})`);
  }

  const bias = score > 0 ? 'long' : score < 0 ? 'short' : 'neutral';
  return { score, bias, reasons };
}

module.exports = { computeIndicators, scoreSignal, last, prev };

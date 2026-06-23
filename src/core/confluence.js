'use strict';

/**
 * Motor de CONFLUENCIA: cuenta cuántos factores independientes apuntan a la misma
 * dirección (tendencia, momentum, niveles de Volume Profile/nPOC, ballenas,
 * sentimiento, funding). Más factores alineados = mayor convicción = más confianza.
 *
 * Devuelve { long, short, dominant, count, factors:[{name,dir}] }.
 */
function computeConfluence(candidate, symCtx = {}, globalCtx = {}) {
  const factors = [];
  const add = (name, dir) => dir && factors.push({ name, dir });

  // Usa el timeframe mayor disponible.
  const tfs = Object.keys(candidate.byTimeframe || {});
  const ind = tfs.length ? candidate.byTimeframe[tfs[tfs.length - 1]] : null;
  const price = ind?.price ?? symCtx.volumeProfile?.price;

  if (ind) {
    // 1) Tendencia (EMAs)
    if (ind.ema20 > ind.ema50 && ind.ema50 > ind.ema200) add('EMAs alcistas', 'long');
    else if (ind.ema20 < ind.ema50 && ind.ema50 < ind.ema200) add('EMAs bajistas', 'short');
    // 2) Momentum (MACD)
    if (ind.macdHist > 0) add('MACD+', 'long');
    else if (ind.macdHist < 0) add('MACD-', 'short');
    // 3) RSI extremo (contrarian)
    if (ind.rsi != null && ind.rsi < 32) add('RSI sobreventa', 'long');
    else if (ind.rsi != null && ind.rsi > 68) add('RSI sobrecompra', 'short');
    // 4) ADX fuerte: vota por la dirección de la tendencia solo si las EMAs están alineadas
    if (ind.adx != null && ind.adx >= 25) {
      if (ind.ema20 > ind.ema50 && ind.ema50 > ind.ema200) add('ADX fuerte en tendencia', 'long');
      else if (ind.ema20 < ind.ema50 && ind.ema50 < ind.ema200) add('ADX fuerte en tendencia', 'short');
    }
  }

  const near = (a, b, tol = 0.007) => a != null && b != null && Math.abs(a - b) / b <= tol;

  // 5) Volume Profile: precio en borde del valor
  const vp = symCtx.volumeProfile;
  if (vp && price != null) {
    if (near(price, vp.val) || price < vp.val) add('en/bajo VAL (soporte)', 'long');
    else if (near(price, vp.vah) || price > vp.vah) add('en/sobre VAH (resistencia)', 'short');
  }

  // 6) nPOC virgen cercano = soporte/resistencia
  const np = symCtx.nakedPOCs;
  if (np && price != null) {
    if (np.below && near(price, np.below)) add('en nPOC inferior (soporte)', 'long');
    if (np.above && near(price, np.above)) add('en nPOC superior (resistencia)', 'short');
  }

  // 7) Flujo de ballenas
  if (symCtx.whale) {
    if (symCtx.whale.buyPct >= 60) add('ballenas comprando', 'long');
    else if (symCtx.whale.sellPct >= 60) add('ballenas vendiendo', 'short');
  }

  // 8) Sentimiento (contrarian)
  if (globalCtx.fearGreed) {
    if (globalCtx.fearGreed.value < 25) add('miedo extremo', 'long');
    else if (globalCtx.fearGreed.value > 75) add('codicia extrema', 'short');
  }

  // 9) Funding extremo (riesgo de squeeze a favor)
  if (symCtx.funding?.ratePct != null) {
    if (symCtx.funding.ratePct < -0.03) add('funding negativo (squeeze al alza)', 'long');
    else if (symCtx.funding.ratePct > 0.05) add('funding positivo (squeeze a la baja)', 'short');
  }

  const long = factors.filter((f) => f.dir === 'long').length;
  const short = factors.filter((f) => f.dir === 'short').length;
  const dominant = long === short ? 'neutral' : long > short ? 'long' : 'short';
  const count = Math.max(long, short);
  return { long, short, dominant, count, factors };
}

/** Texto para inyectar en el prompt de decisión. */
function formatConfluence(conf) {
  if (!conf || !conf.factors.length) return '';
  const list = conf.factors.map((f) => `${f.name} (${f.dir})`).join(', ');
  return (
    `CONFLUENCIA AUTOMÁTICA: ${conf.long} factores LONG vs ${conf.short} SHORT. ` +
    `Lado dominante: ${conf.dominant} con ${conf.count} factores [${list}]. ` +
    `Regla: <2 factores alineados = baja convicción (confianza baja o none); 2-3 = media; 4+ = alta. ` +
    `La confianza que reportes debe reflejar este conteo.`
  );
}

module.exports = { computeConfluence, formatConfluence };

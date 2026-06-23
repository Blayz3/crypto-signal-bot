'use strict';

/**
 * Genera un BRIEF de análisis (sin IA) para pegar en el chat con Claude.
 * Hace todo el trabajo pesado GRATIS: rankea candidatas, trae datos de mercado
 * (Volume Profile, nPOC, ballenas, sentimiento, noticias), calcula confluencia y
 * adjunta las reglas activas del cerebro. Tú pegas la salida en el chat y Claude
 * te da los trades A+ — sin gastar API.
 *
 * Uso: node scripts/brief.js   (o npm run brief)
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { ExchangeClient } = require('../src/core/exchange');
const { rankSymbols, loadConfig, round } = require('../src/core/scanner');
const { MarketData } = require('../src/core/marketdata');
const { Brain, regimeFromCandidate } = require('../src/core/brain');
const { computeConfluence } = require('../src/core/confluence');

const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString('en-US', { maximumFractionDigits: 6 }));

async function pMap(items, fn, c = 6) {
  const r = new Array(items.length);
  let i = 0;
  async function w() { while (i < items.length) { const k = i++; r[k] = await fn(items[k]); } }
  await Promise.all(Array.from({ length: Math.min(c, items.length) }, w));
  return r;
}

(async () => {
  const config = loadConfig();
  const ex = new ExchangeClient(config);
  const symbols = await ex.resolveSymbols();
  const errors = [];
  const ranked = await rankSymbols(config, ex, symbols, { errors });

  // Para el brief NO aplicamos el filtro duro de ADX del scanner en vivo: mostramos
  // las mejores por score y anotamos el ADX/régimen para que Claude elija el setup
  // adecuado (tendencia si ADX alto, rango/reversión si bajo).
  const minScore = config.funnel.min_local_score;
  const lastTf = config.timeframes[config.timeframes.length - 1];
  const candidates = ranked
    .filter((r) => Math.abs(r.score) >= minScore)
    .slice(0, config.funnel.max_ai_candidates || 8);

  const market = new MarketData(config);
  let global = {};
  try { global = await market.globalContext(); } catch (e) { /* ignore */ }
  const symCtxs = {};
  await pMap(candidates, async (c) => {
    try { symCtxs[c.symbol] = await market.symbolContext(c.symbol); } catch (e) { symCtxs[c.symbol] = {}; }
  });

  // Reglas activas del cerebro (siempre-inyectadas), condensadas.
  const brain = new Brain(config).load();
  const core = brain.notes.filter((n) => n.type === 'principio' || n.type === 'riesgo');

  const L = [];
  L.push('# BRIEF DE TRADING — analízalo con el cerebro y dame los trades A+');
  L.push('');
  L.push('Eres mi analista. Aplica las REGLAS DEL CEREBRO a cada candidata y devuélveme, por cada una,');
  L.push('una de: **none** (si no es A+) o un trade con **dirección, orderType (limit/market), entrada,');
  L.push('stop, target, R:R, confianza % y el setup aplicado**. Prioriza alta confluencia y profit > WR.');
  L.push('');
  if (global.fearGreed || global.coingecko) {
    const fg = global.fearGreed ? `Fear&Greed ${global.fearGreed.value} (${global.fearGreed.label})` : '';
    const cg = global.coingecko ? `mcap ${global.coingecko.mcapChange24h?.toFixed(2)}% 24h, dom BTC ${global.coingecko.btcDominance?.toFixed(1)}%` : '';
    L.push(`**Contexto global:** ${[fg, cg].filter(Boolean).join(' · ')}.`);
  }
  if (global.news?.length) L.push(`**Noticias:** ${global.news.slice(0, 3).map((n) => `"${n.title}"`).join(' · ')}.`);
  L.push('');
  L.push('## Reglas del cerebro (resumen)');
  for (const n of core) L.push(`- ${n.rule}`);
  L.push('');
  if (!candidates.length) {
    L.push('## Sin candidatas');
    L.push('Ninguna moneda supera el umbral de confluencia mínima. Mercado plano/indeciso → esperar es lo correcto (none).');
    process.stdout.write(L.join('\n') + '\n');
    return;
  }
  const trending = candidates.filter((c) => (c.byTimeframe[lastTf]?.adx ?? 0) >= 25).length;
  L.push(`## Candidatas (${candidates.length}) — ${trending} en tendencia (ADX≥25), resto en rango`);

  for (const c of candidates) {
    const sc = symCtxs[c.symbol] || {};
    const regime = regimeFromCandidate(c);
    const conf = computeConfluence(c, sc, global);
    const ind = c.byTimeframe[lastTf] || {};
    L.push('');
    L.push(`### ${c.symbol} — $${fmt(c.price)}`);
    L.push(`- Sesgo local: **${c.bias}** (score ${round(c.score)}) · Régimen: ${regime}`);
    L.push(`- Indicadores (${lastTf}): RSI ${fmt(ind.rsi)}, EMA20 ${fmt(ind.ema20)}/50 ${fmt(ind.ema50)}/200 ${fmt(ind.ema200)}, ADX ${fmt(ind.adx)}, MACD-hist ${fmt(ind.macdHist)}, ATR ${fmt(ind.atr)}`);
    if (sc.volumeProfile) L.push(`- Volume Profile: POC ${fmt(sc.volumeProfile.poc)} · VAH ${fmt(sc.volumeProfile.vah)} · VAL ${fmt(sc.volumeProfile.val)}`);
    if (sc.nakedPOCs && (sc.nakedPOCs.above || sc.nakedPOCs.below)) L.push(`- nPOC vírgenes: arriba ${fmt(sc.nakedPOCs.above)} · abajo ${fmt(sc.nakedPOCs.below)}`);
    if (sc.whale) L.push(`- Ballenas: ${sc.whale.buyPct.toFixed(0)}% compras / ${sc.whale.sellPct.toFixed(0)}% ventas (sesgo ${sc.whale.bigBias})`);
    if (sc.funding?.ratePct != null) L.push(`- Funding: ${sc.funding.ratePct.toFixed(4)}%`);
    L.push(`- **CONFLUENCIA: ${conf.long} LONG vs ${conf.short} SHORT** → dominante ${conf.dominant} (${conf.count}) [${conf.factors.map((f) => f.name).join(', ')}]`);
  }
  L.push('');
  L.push('---');
  L.push('Recuerda: meta 130R/mes con PF > WR%. Solo A+ (alta confluencia, R:R ≥ 2, ADX≥25 a favor de tendencia). Sin A+: none.');

  process.stdout.write(L.join('\n') + '\n');
})().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});

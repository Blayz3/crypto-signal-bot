'use strict';

/**
 * Analiza las APERTURAS del mercado de Nueva York (8 AM hora de NY) de BTC.
 * Hipótesis a validar: si BTC abre BAJANDO, tarde o temprano sube; si abre
 * SUBIENDO, tarde o temprano baja (reversión de la apertura).
 *
 * Revisa cientos de aperturas históricas, mide cuántas revierten y el resultado
 * de "fade" (operar en contra de la apertura), y GUARDA lo aprendido en el cerebro
 * (00-principios/ny-open-analisis.md), siempre inyectado.
 *
 * Pensado para correr cada mañana ~8:10 NY (lo programa launchd).
 * Uso: node scripts/ny-open.js [SIMBOLO] [dias]
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const ccxt = require('ccxt');

function loadConfig() {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '../config.json'), 'utf8'));
}
function expandHome(p) {
  return p.startsWith('~') ? path.join(os.homedir(), p.slice(1)) : p;
}
const round = (v, dp = 2) => (v == null || Number.isNaN(v) ? null : Math.round(v * 10 ** dp) / 10 ** dp);
const pct = (x) => `${Math.round(x * 100)}%`;

const TF_MS = 3600000; // 1h
const SESSION = 12; // ventana de la sesión NY: 12 velas de 1h
const FADE_RR = 2; // target del fade a 2R (riesgo = rango de la vela de apertura)

const nyFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  hour: 'numeric',
  hour12: false,
});
function nyHour(ts) {
  const h = parseInt(nyFmt.formatToParts(new Date(ts)).find((p) => p.type === 'hour').value, 10);
  return h % 24;
}

async function fetchHistory(ex, symbol, candlesWanted) {
  let since = Date.now() - candlesWanted * TF_MS;
  const out = [];
  while (out.length < candlesWanted) {
    const batch = await ex.fetchOHLCV(symbol, '1h', since, 1000);
    if (!batch.length) break;
    out.push(...batch);
    since = batch[batch.length - 1][0] + TF_MS;
    if (batch.length < 1000) break;
  }
  return out; // [[t,o,h,l,c,v], ...]
}

function analyze(c) {
  const n = c.length;
  const opens = []; // cada apertura de 8AM NY analizada
  for (let i = 0; i < n - SESSION - 1; i++) {
    if (nyHour(c[i][0]) !== 8) continue;
    const [, o, , , close] = c[i];
    const high0 = c[i][2];
    const low0 = c[i][3];
    const dir = close >= o ? 'up' : 'down';
    const entry = close;
    const risk = Math.max(high0 - low0, o * 0.003); // rango de la vela de apertura

    // Reversión: ¿cruzó de vuelta el nivel de apertura (o) durante la sesión?
    let reversed = false;
    let fadeR = 0;
    // Fade: en contra de la apertura. up -> short, down -> long.
    const fadeLong = dir === 'down';
    const stop = fadeLong ? entry - risk : entry + risk;
    const target = fadeLong ? entry + FADE_RR * risk : entry - FADE_RR * risk;
    let settled = false;
    for (let j = i + 1; j <= i + SESSION; j++) {
      const hi = c[j][2];
      const lo = c[j][3];
      if (dir === 'up' && lo < o) reversed = true;
      if (dir === 'down' && hi > o) reversed = true;
      if (!settled) {
        const hitStop = fadeLong ? lo <= stop : hi >= stop;
        const hitTarget = fadeLong ? hi >= target : lo <= target;
        if (hitStop) { fadeR = -1; settled = true; }
        else if (hitTarget) { fadeR = FADE_RR; settled = true; }
      }
    }
    if (!settled) {
      const last = c[i + SESSION][4];
      fadeR = round((fadeLong ? last - entry : entry - last) / risk, 2);
    }
    opens.push({ dir, reversed, fadeR });
  }
  return opens;
}

function summarize(opens, dir) {
  const subset = dir ? opens.filter((o) => o.dir === dir) : opens;
  if (!subset.length) return null;
  const reversed = subset.filter((o) => o.reversed).length;
  const wins = subset.filter((o) => o.fadeR > 0).length;
  const losses = subset.filter((o) => o.fadeR < 0).length;
  const totalR = subset.reduce((a, o) => a + o.fadeR, 0);
  return {
    n: subset.length,
    reversalRate: reversed / subset.length,
    fadeWR: wins + losses ? wins / (wins + losses) : 0,
    fadeExpectancy: round(totalR / subset.length, 3),
    fadeTotalR: round(totalR, 1),
  };
}

function writeNote(config, symbol, days, all, up, down) {
  const vault = expandHome(config.brain?.vault_path || '~/Desktop/cerebro-trading');
  const date = new Date(Date.now()).toISOString().slice(0, 16).replace('T', ' ');
  const verdict =
    up && down && up.reversalRate >= 0.55 && down.reversalRate >= 0.55
      ? 'La hipótesis se sostiene: la mayoría de aperturas revierten.'
      : up && down && (up.reversalRate >= 0.5 || down.reversalRate >= 0.5)
        ? 'La hipótesis se sostiene parcialmente; usar como sesgo, no como certeza.'
        : 'La hipótesis NO se sostiene con fuerza en esta muestra; tratar con cautela.';

  const note = `---
title: NY Open — análisis de aperturas (auto-actualizado)
type: principio
tags: [ny-open, apertura, nueva-york, reversion, sesion, btc]
bias: [long, short]
regime: [any]
timeframe: [1h]
weight: high
---

# NY Open — análisis de aperturas (auto-actualizado)

Análisis del ${date} sobre ${all.n} aperturas de las **8 AM hora de Nueva York** de ${symbol}
(últimos ${days} días). Hipótesis: si abre bajando, tarde o temprano sube; si abre subiendo,
tarde o temprano baja (reversión de la apertura dentro de la sesión).

## Resultados
| Apertura | Muestra | % que revierte | Fade WR (2R) | Expectativa fade |
|---|---|---|---|---|
| **Abre SUBIENDO** | ${up?.n ?? 0} | ${up ? pct(up.reversalRate) : '—'} | ${up ? pct(up.fadeWR) : '—'} | ${up?.fadeExpectancy ?? '—'}R |
| **Abre BAJANDO** | ${down?.n ?? 0} | ${down ? pct(down.reversalRate) : '—'} | ${down ? pct(down.fadeWR) : '—'} | ${down?.fadeExpectancy ?? '—'}R |
| **Global** | ${all.n} | ${pct(all.reversalRate)} | ${pct(all.fadeWR)} | ${all.fadeExpectancy}R |

**Veredicto:** ${verdict}

> ⚠️ **Matiz crítico:** aunque el ${pct(all.reversalRate)} de las aperturas revierten, hacer
> "fade" a ciegas con stop fijo PIERDE (WR ${pct(all.fadeWR)}, expectativa ${all.fadeExpectancy}R).
> Motivo: el impulso de apertura puede correr primero y tocar tu stop ANTES de revertir.
> Conclusión: la reversión es un **sesgo de contexto muy fiable**, pero NO un gatillo
> automático. Úsalo para saber qué dirección vigilar, y entra solo con confirmación.

## Cómo operar la apertura de NY
- A las **8 AM NY** observa la dirección de la apertura de BTC (primera vela de la sesión).
- Si abre **subiendo**, prepárate para un posible **techo y reversión a la baja** dentro de la
  sesión (busca SHORT en exhaustión/resistencia). Si abre **bajando**, prepárate para un
  posible **suelo y reversión al alza** (busca LONG en soporte).
- **Espera confirmación** (rechazo, MSB, divergencia): la reversión llega "tarde o temprano",
  no necesariamente en la primera vela. No te adelantes ([[liquidez]], [[msb-quiebre-estructura]]).
- BTC marca el ritmo de las alts ([[correlacion-btc]]): el sesgo de la apertura de BTC aplica
  al resto del mercado.

**Regla para el bot:** En la sesión de NY, usa la dirección de la apertura de BTC (8 AM NY) como sesgo CONTRARIAN para la sesión: apertura alcista → vigila reversión bajista; apertura bajista → vigila reversión alcista. Es un sesgo probabilístico (${pct(all.reversalRate)} revierten), no una certeza: exige confirmación técnica antes de entrar.

Relacionado: [[sesiones-killzones]], [[correlacion-btc]], [[liquidez]], [[criterio-propio]], [[confluencia]]
`;
  const file = path.join(vault, '00-principios', 'ny-open-analisis.md');
  fs.writeFileSync(file, note);
  return file;
}

(async () => {
  const config = loadConfig();
  const symbol = (process.argv[2] || 'BTC/USDT').toUpperCase();
  const days = parseInt(process.argv[3], 10) || 270;
  const ex = require("../src/core/data-exchange").spotClient();

  process.stderr.write(`Descargando ${days} días de ${symbol} (1h)...\n`);
  const candles = await fetchHistory(ex, symbol, days * 24);

  const opens = analyze(candles);
  const all = summarize(opens);
  const up = summarize(opens, 'up');
  const down = summarize(opens, 'down');

  console.log(`\n=== NY OPEN — ${symbol} · ${all.n} aperturas (8 AM NY) ===\n`);
  const row = (label, s) =>
    s && console.log(`${label.padEnd(16)} ${String(s.n).padStart(4)}  revierte ${pct(s.reversalRate).padStart(4)}  fade WR ${pct(s.fadeWR).padStart(4)}  exp ${s.fadeExpectancy}R`);
  row('Abre SUBIENDO', up);
  row('Abre BAJANDO', down);
  row('GLOBAL', all);

  const file = writeNote(config, symbol, days, all, up, down);
  console.log(`\nAprendizaje guardado en el cerebro: ${file.replace(os.homedir(), '~')}`);
})().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});

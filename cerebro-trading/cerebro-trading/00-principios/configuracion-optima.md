---
title: Configuración óptima y la verdad sobre el Profit Factor
type: principio
tags: [optimizacion, profit-factor, pf, expectativa, adx, atr, robustez, overfitting]
bias: [long, short]
regime: [trending]
timeframe: [1h]
weight: high
---

# Configuración óptima y la verdad sobre el Profit Factor

Resultado de búsquedas exhaustivas (cientos de configs) validadas **out-of-sample** (en
monedas distintas a las del tuneo). Lo único que importa es lo que aguanta fuera de muestra.

## Config robusta para el bot en vivo
- **ADX ≥ 25** (tendencia real; era la causa #1 de pérdidas el chop) — aplicado en `funnel.min_adx`.
- **Solo a favor de la EMA200** (tendencia), **stop ~2×ATR**, **target 2R** (3R solo si la estructura lo regala).
- Para MÁXIMA rentabilidad: setup de **momentum/continuación**, ADX≥35, y **dejar correr los
  ganadores** (trailing stop o target amplio). Robusto: **PF ≈ 2, expectativa ~0.4-0.5R/trade,
  WR ~44%**. Eso es un sistema MUY bueno (ganas ~2× lo que pierdes).

## Revalidación 2026-06-12 (datos frescos, 90 días)
Se repitió la búsqueda completa: 30 configs daban PF≥3 in-sample y **ninguna aguantó
out-of-sample** (otra vez sobreajuste). El ganador robusto: **momentum-macd con ADX≥35,
stop 2×ATR y target amplio 4-6R (trailing)** → PF ≈ 2.0, expectativa ~0.55R/trade, WR 44%.
Confirma el camino: filtro duro de tendencia (ADX 30-35) + dejar correr ganadores; el PF>3
solo puede venir de la capa de DISCRECIÓN (filtro A+ del cerebro), no del motor mecánico.

## La verdad sobre PF≥3 (lección de overfitting)
Se buscó intensamente PF≥3. Con parámetros extremos (ADX≥45 + 3×ATR + trailing agresivo)
salía PF 3.3 **in-sample**... pero en monedas distintas **colapsaba a PF 1.09**. Era
sobreajuste puro.

| | In-sample | Out-of-sample |
|---|---|---|
| momentum ADX≥45 trailing | PF 3.3 | **PF 1.09** 💥 |

**Conclusión: un PF≥3 mecánico estable NO existe. El techo robusto es PF ≈ 2.** Forzar PF≥3
(muestras diminutas, params extremos) es engañarse y perder dinero real. El PF alto de los
buenos traders viene de **DISCRECIÓN + CONFLUENCIA** (Volume Profile/nPOC + estructura +
nivel + contexto en pocas entradas A+), que un backtest a ciegas no puede medir — ese es el
trabajo de la IA + cerebro, no del motor mecánico.

**Regla para el bot:** Favorece momentum/continuación con ADX≥25 (mejor ≥35) a favor de la EMA200, stop ~2×ATR, y deja correr los ganadores (trailing o target amplio). Razona con expectativa realista (~0.4-0.5R/trade, PF ~2): el edge es modesto pero real. NUNCA fuerces operaciones buscando un PF imposible; el PF alto real viene de apilar confluencia en pocas entradas A+, no de operar más. Desconfía de cualquier promesa de PF≥3 garantizado: es sobreajuste.

Relacionado: [[expectativa-y-winrate]], [[objetivo-profit]], [[confluencia]], [[volume-profile]], [[momentum-vs-reversion]], [[lecciones-aprendidas]]

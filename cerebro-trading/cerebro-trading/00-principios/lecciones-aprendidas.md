---
title: Lecciones aprendidas (de trades perdidos)
type: principio
tags: [lecciones, errores, backtest, perdidas, aprendizaje, causa-raiz]
bias: [long, short]
regime: [any]
timeframe: [any]
weight: high
---

# Lecciones aprendidas (de trades perdidos)

Generado del backtest/diario (2026-06-11). Muestra: 142 trades,
52 ganados / 76 perdidos (WR 41%, +88.31R).

El bot debe ANALIZAR estos errores y mejorar su criterio con ellos (ver [[analizar-errores]]),
no solo evitarlos a ciegas.

## Análisis de causa raíz de los 79 trades perdidos
- **76** pérdidas → Entrada/contexto a revisar (sin patrón único evidente)
- **3** pérdidas → Sin momentum (cerró por tiempo, la idea no tenía fuerza)

## Lecciones derivadas
- Dirección LONG: WR bajo (26%). Revisa si el contexto de mercado la favorece antes de tomarla.

## Lección 2026-06-12 — trades reales del diario (verificados contra precio)
Los 5 primeros trades reales del bot: **4 shorts perdedores (−4R) y 1 long ganador (+2.04R)**.
Causa raíz de las 4 pérdidas:
- **Riesgo de correlación:** los 4 shorts (BNB, BTC, SUI, ADA) se emitieron en la MISMA pasada
  (23:02-23:04), misma dirección, alts correlacionadas → era UNA sola apuesta contra BTC con 4R
  de riesgo. Todos tocaron stop juntos.
- **Short tardío en miedo extremo:** Fear&Greed ~12 y funding negativo = mercado sobre-vendido y
  shorts masificados (combustible de squeeze). Vender ahí es llegar tarde; el rebote los barrió.
- El ÚNICO ganador fue el **contrarian** (DOGE long, limit en soporte + miedo extremo, conf 78):
  exactamente el patrón de [[squeeze-funding]] y [[liquidity-grab-reversal]].

Lecciones: (1) máximo 2 señales simultáneas en la misma dirección — recorta a las de mayor
confluencia; (2) con miedo extremo + funding negativo NO emitas shorts de continuación tardíos:
o esperas el pullback, o buscas el long contrarian en nivel; (3) las entradas limit en nivel
con alta confluencia superan a los market de continuación apurados.

**Regla para el bot:** Estudia la causa raíz de cada error de arriba. Para cada futura entrada que se parezca a un error pasado, identifica QUÉ condición faltó (contexto, confluencia, régimen, timing o stop) y EXÍGELA antes de tomarla. Aprende del error para afinar el criterio; sé más estricto donde fallaste, no simplemente inactivo.

Relacionado: [[analizar-errores]], [[criterio-propio]], [[proceso-sobre-resultado]], [[confluencia]]

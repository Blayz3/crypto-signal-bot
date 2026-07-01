---
title: Squeeze de volatilidad (Bollinger dentro de Keltner)
type: setup
tags: [squeeze, volatilidad, bollinger, keltner, breakout, expansion, ttm]
bias: [long, short]
regime: [ranging, trending]
timeframe: [15m, 1h, 4h]
weight: high
---

# Squeeze de volatilidad (Bollinger dentro de Keltner)

La volatilidad en crypto es **cíclica**: contracción → expansión. Cuando las bandas de
Bollinger se meten DENTRO de los canales de Keltner ("squeeze"), el mercado está comprimido
y se acerca un **movimiento explosivo**. Se opera la EXPANSIÓN en la dirección de la ruptura,
alineada con la tendencia mayor.

## Playbook (LONG; espejo para SHORT)
1. **Detecta el squeeze:** bandas de Bollinger (20, 2σ) por dentro de Keltner (20, 1.5×ATR).
   Rango estrecho, ATR cayendo, velas pequeñas. Cuanto más largo el squeeze, mayor la descarga.
2. **Contexto de tendencia:** el precio y las EMAs (50/200) del timeframe alto indican sesgo.
   Prefiere romper A FAVOR de esa tendencia (continuación) → mayor probabilidad.
3. **Gatillo:** vela que CIERRA fuera del rango del squeeze con volumen sobre el promedio y
   momentum a favor (MACD/RSI acompañando). Sin volumen = sospecha de fakeout.
4. **Entrada:** market al cierre de ruptura, o limit en el retest del borde roto.
5. **Stop:** al otro lado del rango del squeeze (invalidación estructural, ~1.5-2×ATR).
6. **Target:** la expansión suele medir al menos el ancho del rango comprimido; deja correr
   con trailing hacia el siguiente nivel/liquidez ([[naked-poc]], [[volume-profile]]).

**Cuándo evitarlo:** ruptura contra la tendencia mayor sin catalizador, o sin expansión de
volumen (probable trampa). En squeeze muy corto, la descarga es pequeña: exige más confluencia.

**Regla para el bot:** Cuando la volatilidad esté comprimida (ATR bajo/rango estrecho, Bollinger dentro de Keltner), espera la ruptura con CIERRE fuera del rango + volumen, entra a favor de la tendencia mayor con stop al otro lado del rango y R:R≥2 dejando correr el ganador; sin volumen o contra-tendencia sin catalizador, NONE.

Relacionado: [[volatilidad-atr]], [[momentum-continuacion]], [[confluencia]], [[volume-profile]]

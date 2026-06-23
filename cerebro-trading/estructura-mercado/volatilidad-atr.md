---
title: Volatilidad y ATR
type: estructura
tags: [volatilidad, atr, stops, sizing, expansion, contraccion]
bias: [long, short]
regime: [any]
timeframe: [any]
weight: medium
---

# Volatilidad y ATR

El **ATR (Average True Range)** mide cuánto se mueve el precio en promedio. Es la base para
poner stops sensatos y dimensionar la posición según la "energía" del mercado.

**Usos:**
- **Stops por ATR:** stop a 1.5–2× ATR de la entrada da aire al ruido normal sin quedar
  absurdamente lejos ([[stop-loss]]). Stops fijos en % ignoran la volatilidad real.
- **Tamaño por ATR:** más volatilidad → stop más ancho → menor tamaño para mantener el
  riesgo en $ constante ([[tamano-posicion]]).
- **Régimen de volatilidad:**
  - **Contracción** (ATR cayendo, Bollinger estrechas): calma antes de la tormenta. Suele
    preceder una expansión/ruptura ([[ruptura-rango]]).
  - **Expansión** (ATR disparado): movimiento en curso; cuidado con entrar tarde y con stops
    que se barren por las mechas grandes.

**Regla para el bot:** Dimensiona stops y tamaño con el ATR (stop 1.5–2×ATR, menos tamaño si hay más volatilidad). Contracción de volatilidad = posible ruptura inminente; expansión extrema = cuidado con entradas tardías y barridos.

Relacionado: [[stop-loss]], [[tamano-posicion]], [[ruptura-rango]], [[bollinger-scan]]

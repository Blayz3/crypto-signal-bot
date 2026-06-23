---
title: Reversión a la media en rango (Bollinger)
type: setup
tags: [reversion, rango, bollinger, sobreextension, mean-reversion]
bias: [long, short]
regime: [ranging]
timeframe: [15m, 1h]
weight: low
---

# Reversión a la media en rango (Bollinger)

En mercados **sin tendencia** (ADX bajo), el precio oscila entre extremos y vuelve a la
media. Se opera la vuelta, no la ruptura.

**Condiciones (LONG en el extremo inferior; espejo para SHORT):**
1. **Rango claro / ADX < 20** (sin tendencia, [[tendencia-vs-rango]]).
2. Precio toca/perfora la **banda inferior de Bollinger** (sobre-extensión).
3. **Confirmación de rechazo:** vela de reversión (pin/engulfing) o divergencia RSI.
4. Target = la **media (banda media / EMA20)** o el extremo opuesto del rango.

**Gestión:**
- Stop ajustado bajo el mínimo del rechazo. R:R suele ser modesto (1.5-2R), acorde al rango.
- Toma parcial en la media y deja correr al otro extremo si el rango es amplio.

**Cuándo NO usarlo:**
- En tendencia fuerte (ADX alto): el precio puede "caminar" la banda y seguir. Aquí toca
  momentum, no reversión ([[momentum-vs-reversion]]).

**Regla para el bot:** Solo en rango (ADX bajo): opera el rechazo en la banda de Bollinger de vuelta a la media, con confirmación de vela/divergencia. Nunca lo apliques en tendencia fuerte (la banda se camina). R:R modesto, stop ajustado.

Relacionado: [[momentum-vs-reversion]], [[tendencia-vs-rango]], [[rechazo-soporte-resistencia]], [[divergencias-rsi]]

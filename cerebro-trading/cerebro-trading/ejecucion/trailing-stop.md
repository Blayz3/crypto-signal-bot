---
title: Trailing stop
type: estructura
tags: [trailing, stop, dinamico, tendencia, proteger-ganancia]
bias: [long, short]
regime: [trending]
timeframe: [any]
weight: medium
---

# Trailing stop

Stop dinámico que **sigue al precio a favor** para proteger ganancia mientras dejas correr
un trade. Solo se mueve en la dirección del trade, nunca en contra.

## Métodos
- **Por estructura:** en un long, mueve el stop bajo cada nuevo mínimo creciente (HL); en
  short, sobre cada máximo decreciente (LH). El más lógico: respeta la estructura.
- **Por ATR:** mantén el stop a N×ATR del precio. Da aire en mercados volátiles.
- **Por EMA:** trailing bajo la EMA20/50 mientras la tendencia la respete.

## Cuándo usarlo
Ideal en **tendencias fuertes** (ADX alto) para capturar movimientos extendidos sin cerrar
demasiado pronto. En rango no sirve (te saca con el ruido). Combínalo con TP parcial:
asegura una parte y deja correr el resto con trailing.

**Regla para el bot:** En trades en tendencia fuerte, sugiere trailing del stop por estructura (bajo cada HL en long / sobre cada LH en short) o por ATR, solo a favor. No apliques trailing en rango.

Relacionado: [[gestion-de-posicion]], [[tendencia-vs-rango]], [[stop-loss]]

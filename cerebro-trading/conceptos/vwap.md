---
title: VWAP (precio medio ponderado por volumen)
type: estructura
tags: [vwap, volumen, precio-medio, soporte-dinamico, institucional]
bias: [long, short]
regime: [trending, ranging]
timeframe: [5m, 15m, 1h]
weight: medium
---

# VWAP (precio medio ponderado por volumen)

El **VWAP** es el precio promedio ponderado por volumen del periodo (normalmente del día).
Las instituciones lo usan como referencia de "precio justo": comprar bajo VWAP, vender sobre VWAP.

**Cómo leerlo:**
- **Precio sobre VWAP:** sesgo intradía alcista; los compradores controlan. Los retrocesos
  al VWAP son oportunidades de LONG (soporte dinámico).
- **Precio bajo VWAP:** sesgo bajista; los rebotes al VWAP son oportunidades de SHORT
  (resistencia dinámica).
- **VWAP plano y precio cruzándolo seguido:** rango/indecisión.

**Uso práctico:**
- El VWAP actúa como **imán y soporte/resistencia dinámico** en el día.
- Confluencia: un retest al VWAP que coincide con un order block o nivel = entrada de calidad.
- Reversión a la media: precio muy alejado del VWAP tiende a volver hacia él.

**Regla para el bot:** Usa el VWAP como referencia de valor intradía: sobre VWAP favorece LONG en retrocesos al VWAP, bajo VWAP favorece SHORT en rebotes al VWAP. Precio muy lejos del VWAP = posible reversión a la media.

Relacionado: [[market-profile]], [[soporte-resistencia-dinamico]], [[volumen]], [[order-blocks]]

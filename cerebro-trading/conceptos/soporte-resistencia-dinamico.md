---
title: Soporte / resistencia dinámico
type: estructura
tags: [soporte-dinamico, resistencia-dinamica, ema, vwap, tendencia, trailing]
bias: [long, short]
regime: [trending]
timeframe: [any]
weight: medium
---

# Soporte / resistencia dinámico

A diferencia de los niveles horizontales fijos, el soporte/resistencia **dinámico** se
mueve con el precio: medias móviles, VWAP, líneas de tendencia. En tendencia son donde el
precio "respira" antes de continuar.

**Herramientas dinámicas:**
- **EMA20 / EMA50:** en una tendencia sana, el precio retrocede a ellas y rebota. La EMA20
  manda en tendencias fuertes; la EMA50 en correcciones más profundas.
- **VWAP:** soporte/resistencia intradía ([[vwap]]).
- **Líneas de tendencia:** unen mínimos crecientes (soporte) o máximos decrecientes (resistencia).

**Cómo operarlo:**
- En tendencia alcista, los toques a la EMA20/50 con rechazo = LONG de continuación
  ([[pullback-tendencia]]).
- El cruce decidido del precio bajo la EMA dinámica que sostenía = aviso de debilidad.
- Combina con horizontal: cuando una EMA coincide con un nivel fijo = doble soporte.

**Regla para el bot:** Trata EMA20/50, VWAP y líneas de tendencia como soporte/resistencia dinámico en tendencia: retrocesos con rechazo = continuación. Su ruptura decidida avisa de cambio. La confluencia entre dinámico y horizontal refuerza la zona.

Relacionado: [[pullback-tendencia]], [[vwap]], [[niveles-clave]], [[multi-timeframe]]

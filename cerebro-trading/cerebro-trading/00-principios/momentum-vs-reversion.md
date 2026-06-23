---
title: Momentum vs reversión a la media
type: principio
tags: [momentum, reversion, regimen, estrategia, tendencia, rango]
bias: [long, short]
regime: [any]
timeframe: [any]
weight: high
---

# Momentum vs reversión a la media

Hay dos familias de estrategia, y usar la equivocada para el régimen es el error que más
cuesta. Identifica primero cuál toca.

**Momentum (seguir la fuerza):**
- "Lo que sube tiende a seguir subiendo." Funciona en **tendencia** (ADX alto).
- Entradas: rupturas, pullbacks a favor, continuación. Compras fuerza, no debilidad.
- El optimizador confirmó: en tendencia (ADX≥25) con target amplio, el momentum da el
  mejor profit ([[configuracion-optima]]).

**Reversión a la media (apostar a la vuelta):**
- "Lo estirado tiende a volver al promedio." Funciona en **rango** (ADX bajo) o en extremos.
- Entradas: rechazos en S/R, sobreventa/sobrecompra en rango, vuelta al VWAP/EMA.
- Peligrosa contra una tendencia fuerte (atrapar el cuchillo).

**Cómo elegir:**
- **ADX alto + estructura tendencial → momentum.** **ADX bajo + rango definido → reversión.**
- Nunca apliques reversión (comprar sobreventa) en plena tendencia bajista fuerte, ni
  momentum (comprar ruptura) dentro de un rango plano.

**Regla para el bot:** Clasifica el régimen primero y elige la familia correcta: momentum en tendencia (ADX alto, a favor), reversión solo en rango o extremos confirmados. Aplicar la estrategia equivocada al régimen es un error de causa raíz frecuente.

Relacionado: [[tendencia-vs-rango]], [[configuracion-optima]], [[criterio-propio]], [[analizar-errores]]

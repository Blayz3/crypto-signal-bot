---
title: Pin bar (mecha de rechazo)
type: patron-vela
tags: [vela, pinbar, mecha, rechazo, reversion]
bias: [long, short]
regime: [any]
timeframe: [15m, 1h, 4h]
weight: medium
---

# Pin bar (mecha de rechazo)

Vela con **cuerpo pequeño y una mecha larga** (≥2× el cuerpo) que muestra rechazo
de un precio: el mercado fue hacia un lado y fue empujado de vuelta.

- **Pin alcista (hammer):** mecha larga **abajo**, cierre arriba. Rechazo de precios
  bajos → presión compradora. Útil en soporte.
- **Pin bajista (shooting star):** mecha larga **arriba**, cierre abajo. Rechazo de
  precios altos → presión vendedora. Útil en resistencia.

**Validez:**
- La mecha **penetra un nivel** y lo rechaza (barrido de liquidez + vuelta).
- Cierre del cuerpo en el tercio "correcto" de la vela.
- Confluencia con nivel/EMA/tendencia.

**Entrada típica:** ruptura del extremo del cuerpo en la dirección del rechazo.
**Stop:** más allá de la punta de la mecha.

**Regla para el bot:** Valora el pin bar como rechazo en un nivel clave; la mecha debe penetrar y rechazar el nivel. Stop al otro lado de la mecha. Sin nivel detrás, peso bajo.

Relacionado: [[rechazo-soporte-resistencia]], [[stop-loss]], [[niveles-clave]]

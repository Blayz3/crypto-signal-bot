---
title: Doble techo / doble suelo
type: patron-chart
tags: [doble-techo, doble-suelo, reversion, nivel]
bias: [long, short]
regime: [trending]
timeframe: [1h, 4h, 1d]
weight: medium
---

# Doble techo / doble suelo

Patrones de **reversión** en extremos de movimiento.

- **Doble techo (M):** el precio prueba un máximo, retrocede, vuelve y **falla** en
  superarlo, formando dos picos similares. Reversión bajista. Se confirma al romper el
  "neckline" (el mínimo entre los dos picos).
- **Doble suelo (W):** dos mínimos similares con rebote; reversión alcista. Confirma al
  romper la resistencia entre los dos valles.

**Entrada:** a la **ruptura del neckline** (o en su retest), no en el segundo pico/valle.
**Stop:** sobre el doble techo / bajo el doble suelo.
**Target:** altura del patrón (del pico al neckline) proyectada desde la ruptura.

**Validez:** mejor tras una tendencia extendida (hay algo que revertir), con el segundo
pico/valle mostrando menor volumen o divergencia de RSI.

**Regla para el bot:** Confirma doble techo/suelo solo con la ruptura del neckline; no anticipes en el segundo toque. Mejor con divergencia RSI o caída de volumen en el segundo extremo. Stop al otro lado del patrón.

Relacionado: [[divergencias-rsi]], [[niveles-clave]], [[ruptura-estructura-bos]]

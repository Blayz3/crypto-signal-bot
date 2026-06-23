---
title: Liquidaciones
type: estructura
tags: [liquidaciones, squeeze, apalancamiento, mechas, cascada]
bias: [long, short]
regime: [any]
timeframe: [any]
weight: medium
---

# Liquidaciones

Cuando posiciones apalancadas se cierran forzosamente. Las **cascadas de liquidación**
producen movimientos rápidos y violentos (mechas largas) que suelen revertir.

**Lecturas:**
- **Cascada de liquidación de longs** (caída brusca que liquida compradores) → barrido de
  liquidez bajo soportes → a menudo seguido de rebote. Confluencia con desviación +
  [[oferta-demanda]] de demanda para buscar LONG.
- **Cascada de liquidación de shorts** (subida brusca, short squeeze) → barre máximos →
  posible techo local tras el squeeze.
- Las zonas con mucha liquidez apalancada (clusters de stops) son **imanes**: el precio
  tiende a buscarlas antes de revertir.

**Cómo lo usa el bot:** las mechas largas que barren un extremo del rango y revierten con
MSB son, muchas veces, liquidaciones. Encajan perfecto con el setup RektProof (desviación
→ barrido → MSB → entrada).

**Regla para el bot:** Interpreta mechas violentas que barren un extremo como posibles liquidaciones; espera el MSB de reversión para entrar a favor del rebote, no persigas la cascada. El barrido de liquidez es la trampa; la reversión confirmada es la entrada.

Relacionado: [[00-como-leer-datos]], [[funding-open-interest]], [[rango-y-desviacion]], [[msb-quiebre-estructura]]

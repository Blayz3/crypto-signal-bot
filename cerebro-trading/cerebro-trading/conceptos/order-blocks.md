---
title: Order blocks
type: setup
tags: [order-block, ob, smc, oferta-demanda, institucional, entrada]
bias: [long, short]
regime: [trending, ranging]
timeframe: [15m, 1h, 4h]
weight: high
---

# Order blocks

Un **order block (OB)** es la última vela contraria antes de un movimiento impulsivo que
rompe estructura. Marca dónde el "smart money" colocó órdenes grandes; el precio suele
**regresar a esa zona** antes de continuar.

**Identificación:**
- **Bullish OB:** la última vela **bajista** antes de un fuerte impulso alcista que hace BOS.
  La zona de esa vela es demanda → buscar LONG en su retest.
- **Bearish OB:** la última vela **alcista** antes de un fuerte impulso bajista que hace BOS.
  Zona de oferta → buscar SHORT en su retest.

**Qué lo hace válido:**
- El impulso que sale del OB debe **romper estructura** (BOS) y, mejor aún, **barrer
  liquidez** o dejar un **FVG** ([[fair-value-gap]]).
- OB no mitigado (que el precio no ha vuelto a tocar) > OB ya usado.
- Confluencia con nivel/premium-discount/liquidez = más fuerte.

**Entrada:** orden **limit** en el OB (su apertura o el 50% del cuerpo). **Stop** al otro
lado del OB (si lo traspasa, dejó de ser válido). **Target:** la liquidez opuesta.

**Regla para el bot:** Un order block (última vela contraria antes de un impulso que rompe estructura) es una zona de entrada limit. Bullish OB = demanda para LONG, bearish OB = oferta para SHORT. Prioriza OB no mitigados con BOS + FVG. Stop al otro lado del bloque.

Relacionado: [[oferta-demanda]], [[fair-value-gap]], [[msb-quiebre-estructura]], [[tipos-de-orden]], [[premium-discount]]

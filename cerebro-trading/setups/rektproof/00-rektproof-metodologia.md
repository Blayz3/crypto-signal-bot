---
title: RektProof — metodología (setup estándar)
type: setup
tags: [rektproof, rango, oferta-demanda, msb, liquidez, smc, three-tap]
bias: [long, short]
regime: [ranging, trending]
timeframe: [15m, 1h, 4h]
weight: high
---

# RektProof — metodología (setup estándar)

Sistema de oferta/demanda + estructura. La idea central: **todo movimiento crea un
rango; el precio se desvía para barrer liquidez en un extremo, rompe estructura (MSB)
de vuelta al rango, y eso valida una zona de oferta/demanda como entrada hacia el lado
opuesto del rango.**

## El setup estándar (3 pasos)
1. **Se forma el rango** (Range Forms).
2. **Oferta/Demanda + MSB:** el precio se desvía de un extremo y rompe estructura de
   vuelta al rango → marca la zona S/D.
3. **Formato de tres toques** (three-tap): el retest de la zona S/D = la entrada.

## Lógica direccional
- **Para LONG (en downtrend agotándose / rango):** desviación bajo el rango (barrido del
  mínimo) → **MSB del máximo previo** → la **demanda** es la entrada → target = **máximo
  no tocado** (lado superior del rango).
- **Para SHORT (en uptrend agotándose / rango):** desviación sobre el rango (barrido del
  máximo) → **MSB del mínimo previo** → la **oferta** es la entrada → target = **mínimo
  no tocado** (lado inferior del rango).

## Reglas de la metodología
- **No entrar sin MSB.** La desviación sola no basta; se necesita el quiebre de estructura
  de vuelta al rango como confirmación.
- **Entrada en el retest** de la zona (tercer toque), no persiguiendo la vela de ruptura.
- **Stop:** al otro lado de la zona S/D / más allá del extremo de la desviación (ahí la
  idea se invalida).
- **Target:** el lado opuesto del rango / la liquidez no tocada (untapped high/low).

**Regla para el bot:** Aplica RektProof así: identifica el rango, espera desviación que barra un extremo, confirma MSB de vuelta al rango, y entra en el retest de la zona de oferta/demanda con stop tras la desviación y target al lado opuesto del rango. Sin MSB confirmado, no es entrada.

Relacionado: [[rango-y-desviacion]], [[msb-quiebre-estructura]], [[oferta-demanda]], [[three-tap-format]], [[market-profile]], [[ruptura-estructura-bos]]

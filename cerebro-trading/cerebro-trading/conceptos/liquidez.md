---
title: Liquidez (pools, sweeps, stop hunts)
type: estructura
tags: [liquidez, liquidity, eqh, eql, sweep, stop-hunt, inducement, smc]
bias: [long, short]
regime: [any]
timeframe: [any]
weight: high
---

# Liquidez (pools, sweeps, stop hunts)

El mercado se mueve **hacia la liquidez**: zonas donde hay órdenes acumuladas (stops y
pendientes). El "smart money" empuja el precio a esas zonas para llenar sus órdenes grandes.

**Dónde se acumula la liquidez:**
- **Sobre los máximos** (buy-side liquidity): stops de los shorts + breakout buyers.
- **Bajo los mínimos** (sell-side liquidity): stops de los longs + breakout sellers.
- **Equal highs / equal lows (EQH/EQL):** dos o más máximos/mínimos al mismo nivel → imán de
  liquidez clarísimo. El precio casi siempre los va a "barrer".

**Conceptos clave:**
- **Liquidity sweep / grab:** el precio pincha el nivel, toma la liquidez y **revierte**.
  Es el barrido típico antes del movimiento real ([[rango-y-desviacion]]).
- **Stop hunt:** el mismo barrido, visto desde tus stops: te sacan justo antes de girar.
- **Inducement:** un movimiento "trampa" que induce a entrar antes, creando la liquidez que
  el precio irá a tomar después.

**Cómo operarlo:**
- No pongas el stop **justo** sobre el máximo/bajo el mínimo obvio (ahí va el barrido). Dale
  aire o coloca tras la zona real.
- Un sweep de liquidez **+ CHoCH/MSB de reversión** = entrada de alta probabilidad
  ([[liquidity-grab-reversal]]).
- Identifica qué pool de liquidez es el objetivo probable y úsalo como **target**.

**Regla para el bot:** Identifica los pools de liquidez (máximos/mínimos iguales, swings obvios) como imanes de precio: úsalos como target y desconfía de entradas justo antes de un barrido. Un sweep + reversión confirmada (CHoCH/MSB) es entrada A+. No pongas stops en el nivel obvio.

Relacionado: [[rango-y-desviacion]], [[msb-quiebre-estructura]], [[liquidity-grab-reversal]], [[niveles-clave]]

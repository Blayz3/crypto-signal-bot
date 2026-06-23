---
title: Zonas de oferta y demanda
type: setup
tags: [rektproof, oferta, demanda, supply, demand, zona, entrada]
bias: [long, short]
regime: [ranging, trending]
timeframe: [15m, 1h, 4h]
weight: high
---

# Zonas de oferta y demanda

La zona de **demanda** (compradores) o **oferta** (vendedores) es **el punto de entrada**
del setup RektProof, validada por el MSB.

## Cómo se construye (resumen del método)
1. **Identifica la desviación del rango** en cualquier extremo.
2. **Busca el quiebre de estructura (MSB)** de vuelta al rango.
3. **La zona S/D será tu entrada una vez confirmes el MSB.**

## Direccional
- **Downtrend → LONG:** desviación del mínimo del rango, MSB del máximo previo,
  **la demanda es la entrada**, target = máximo no tocado.
- **Uptrend → SHORT:** desviación del máximo del rango, MSB del mínimo previo,
  **la oferta es la entrada**, target = mínimo no tocado.

## Entrada precisa
La entrada fina es el **retest** de la zona (el "tercer toque", ver [[three-tap-format]]).
El stop va **al otro lado de la zona** (si la zona se traspasa, ya no hay demanda/oferta ahí).

**Regla para el bot:** La entrada es la zona de oferta/demanda que dejó el impulso del MSB, tomada en su retest. Stop al otro lado de la zona; target a la liquidez no tocada del lado opuesto del rango.

Relacionado: [[00-rektproof-metodologia]], [[msb-quiebre-estructura]], [[three-tap-format]], [[stop-loss]]

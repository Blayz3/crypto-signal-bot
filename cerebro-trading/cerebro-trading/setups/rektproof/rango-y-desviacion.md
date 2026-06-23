---
title: Rango y desviación
type: setup
tags: [rektproof, rango, desviacion, liquidez, barrido]
bias: [long, short]
regime: [ranging, trending]
timeframe: [15m, 1h, 4h]
weight: high
---

# Rango y desviación

**Cada tendencia forma un rango.** Tras un impulso, el precio define un rango entre un
extremo y el siguiente opuesto:
- **Downtrend:** el primer mínimo que se forma, seguido del siguiente máximo → ese es el rango.
- **Uptrend:** el primer máximo que se forma, seguido del siguiente mínimo → ese es el rango.

**Una vez que se toma un lado del rango, el target es el lado opuesto.**

## Desviación (deviation)
La **desviación** es cuando el precio sale brevemente fuera del rango por un extremo,
normalmente para **barrer liquidez** (stops más allá del máximo/mínimo) antes de revertir.
- Desviación **bajo** el rango → caza mínimos → busca LONG (si confirma MSB al alza).
- Desviación **sobre** el rango → caza máximos → busca SHORT (si confirma MSB a la baja).

La desviación por sí sola **no es señal**: es la trampa. La señal nace cuando el precio
**rompe estructura de vuelta al rango** (ver [[msb-quiebre-estructura]]).

**Regla para el bot:** Define el rango (extremo + siguiente opuesto). Una mecha/desviación fuera del rango es barrido de liquidez, no entrada. El target por defecto es el lado opuesto del rango. Espera el MSB de vuelta antes de operar.

Relacionado: [[00-rektproof-metodologia]], [[msb-quiebre-estructura]], [[niveles-clave]]

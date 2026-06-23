---
title: Fade de rechazo en nivel clave (tap & reject)
type: setup
tags: [fade, rechazo, resistencia, nivel, htf, supply, tap-reject, reversion]
bias: [long, short]
regime: [trending, ranging]
timeframe: [1h, 4h, 1d]
weight: high
---

# Fade de rechazo en nivel clave (tap & reject)

Uno de los setups más recurrentes: el precio sube (o baja) hasta un **nivel clave previo**
(resistencia, supply, nPOC, value area, máximo previo) lo **toca y lo rechaza** con fuerza,
y revierte. Se opera el rechazo, no la llegada.

## El patrón (tap & reject)
- En **tendencia bajista**: el precio rebota hasta una **resistencia/supply HTF** (un nivel
  desde donde ya cayó antes), la **tagea** (toca) y **rechaza** → reanuda la caída. Fade short.
- En **tendencia alcista**: el precio cae a un **soporte/demanda**, lo toca y rebota → fade long.
- La señal de la imagen: el precio "tagea" el nivel (mecha/vela que entra al nivel) y cierra
  de vuelta fuera → confirmación del rechazo.

## Cómo operarlo
1. **Marca los niveles clave** ANTES: resistencias/soportes HTF, supply/demand, nPOC, bordes
   de value area, máximos/mínimos previos ([[niveles-clave]], [[naked-poc]], [[volume-profile]]).
2. **Espera el toque + rechazo**, no entres anticipando. La confirmación es una vela de
   rechazo (pin/engulfing) o un MSB en menor timeframe ([[msb-quiebre-estructura]]).
3. **Entrada:** limit en el nivel o al confirmar el rechazo. **Stop:** justo al otro lado del
   nivel (si lo traspasa con cierre, el rechazo falló). **Target:** el siguiente nivel/nPOC opuesto.
4. **A favor de la tendencia HTF** el rechazo es más fiable (fade short en resistencia dentro
   de bajista). Contra-tendencia, exige más confluencia ([[bias-direccional]]).

**Regla para el bot:** Cuando el precio llega a un nivel clave HTF (resistencia/supply/nPOC/value area) tras un impulso, espera el "tap & reject" (toca y cierra de vuelta con vela de rechazo) y opera el fade hacia el siguiente nivel. Stop al otro lado del nivel. Más fiable a favor de la tendencia mayor.

Relacionado: [[rechazo-soporte-resistencia]], [[niveles-clave]], [[naked-poc]], [[volume-profile]], [[bias-direccional]], [[liquidez]]

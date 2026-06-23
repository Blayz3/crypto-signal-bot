---
title: Formato de tres toques (three-tap)
type: setup
tags: [rektproof, three-tap, retest, entrada, confluencia]
bias: [long, short]
regime: [ranging, trending]
timeframe: [15m, 1h, 4h]
weight: high
---

# Formato de tres toques (three-tap)

El patrón de tiempo del setup RektProof. Define **cuándo** entrar:

1. **Primer toque:** cuando **se está formando el rango** (el precio define el extremo).
2. **Segundo toque:** la **desviación** — el área donde se forma la zona de oferta/demanda
   (barrido de liquidez + reacción).
3. **Tercer toque:** el **retest** de la zona de demanda/oferta, en confluencia con el área
   del rango. **Ese tercer toque es la entrada.** Eso es todo.

## Idea clave
No se entra en el primer ni en el segundo toque (ahí el setup aún se está formando). Se
espera el **tercer toque** sobre la zona ya validada por el MSB: es el punto de mayor
probabilidad y mejor R:R, con stop ajustado tras la zona.

**Regla para el bot:** Entra en el TERCER toque (retest de la zona S/D ya confirmada por MSB), no en el primero (forma rango) ni en el segundo (desviación). El tercer toque en confluencia con el rango es la entrada de alta probabilidad.

Relacionado: [[00-rektproof-metodologia]], [[oferta-demanda]], [[rango-y-desviacion]], [[rr-minimo]]

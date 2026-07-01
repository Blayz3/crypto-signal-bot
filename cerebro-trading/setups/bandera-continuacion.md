---
title: Bandera / banderín (continuación de tendencia)
type: setup
tags: [bandera, flag, banderin, pennant, continuacion, tendencia, impulso]
bias: [long, short]
regime: [trending]
timeframe: [15m, 1h, 4h]
weight: high
---

# Bandera / banderín (continuación de tendencia)

Uno de los patrones de continuación más fiables en crypto: tras un **impulso fuerte** (asta),
el precio consolida en un canal pequeño contra-tendencia (la bandera) tomando aire, y luego
**continúa** en la dirección del impulso. Es entrar A FAVOR de la fuerza dominante.

## Playbook (LONG; espejo para SHORT)
1. **Asta:** movimiento impulsivo con velas grandes y volumen (define la tendencia y el sesgo).
2. **Bandera:** consolidación ordenada (canal ligeramente bajista o rango estrecho) con
   volumen DECRECIENTE. Retrocede poco (ideal < 38-50% del asta, [[fibonacci]]); si retrocede
   demasiado, pierde calidad.
3. **Contexto:** a favor de EMAs/estructura del timeframe alto (HH-HL). ADX en tendencia.
4. **Gatillo:** ruptura del techo de la bandera con vela de cierre + repunte de volumen.
5. **Entrada:** en la ruptura o en el retest del borde. **Stop:** bajo el mínimo de la bandera
   (invalidación). **Target:** proyecta el tamaño del asta desde la ruptura (medida del patrón);
   deja correr con trailing.

**Cuándo evitarlo:** "bandera" con volumen creciente o que retrocede > 62% del asta (es
reversión, no consolidación); o contra el sesgo del timeframe alto.

**Regla para el bot:** En tendencia clara, tras un impulso con volumen busca la consolidación en bandera (retroceso leve, volumen decreciente) y opera la RUPTURA a favor del impulso: entrada en ruptura/retest, stop bajo el mínimo de la bandera, target = medida del asta con trailing. Si el retroceso es profundo o el volumen crece en la consolidación, es reversión → NONE.

Relacionado: [[momentum-continuacion]], [[pullback-tendencia]], [[confluencia]], [[bias-direccional]]

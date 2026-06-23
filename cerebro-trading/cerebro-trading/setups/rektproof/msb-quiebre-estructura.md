---
title: MSB — quiebre de estructura de mercado
type: setup
tags: [rektproof, msb, estructura, confirmacion, choch]
bias: [long, short]
regime: [ranging, trending]
timeframe: [15m, 1h, 4h]
weight: high
---

# MSB — Market Structure Break (quiebre de estructura)

El **MSB** es la confirmación que convierte una desviación en una entrada válida. Tras
barrer liquidez fuera del rango, el precio debe **romper la estructura interna de vuelta
hacia el rango**, mostrando que la presión cambió de manos.

## Secuencia
1. Precio en rango.
2. **Desviación:** barre un extremo (ej. nuevo mínimo bajo el soporte del rango).
3. **MSB:** rompe el último máximo menor (microestructura) → confirma giro alcista.
   (En espejo para short: barre el máximo y rompe el último mínimo menor.)
4. Eso marca la zona de oferta/demanda desde donde salió el impulso del MSB.

## Por qué importa
El MSB es la diferencia entre "operar el barrido" (perder) y "operar la reacción
confirmada" (ganar). Es lo que filtra las falsas desviaciones.

**Regla para el bot:** Exige un MSB (quiebre de la microestructura de vuelta al rango) tras la desviación antes de validar una entrada. Sin MSB confirmado, la desviación es ruido. El MSB define la zona S/D de entrada.

Relacionado: [[00-rektproof-metodologia]], [[rango-y-desviacion]], [[oferta-demanda]], [[ruptura-estructura-bos]]

---
title: Pullback al VWAP (tendencia intradía)
type: setup
tags: [vwap, pullback, tendencia, intradia, media-movil, valor]
bias: [long, short]
regime: [trending]
timeframe: [5m, 15m, 1h]
weight: medium
---

# Pullback al VWAP (tendencia intradía)

El VWAP (precio medio ponderado por volumen) es la referencia de "valor justo" que siguen los
institucionales intradía. En tendencia, el precio se aleja y **vuelve a testear el VWAP**
(o un VWAP anclado a un evento clave) como soporte/resistencia dinámico → gran punto de entrada
a favor de la tendencia con riesgo pequeño.

## Playbook (LONG; espejo para SHORT)
1. **Tendencia intradía:** precio consistentemente por encima del VWAP con estructura HH-HL.
   (Para eventos, usa un **VWAP anclado** al inicio del movimiento/ruptura/noticia.)
2. **Pullback:** el precio retrocede y toca/roza el VWAP sin perderlo con cierres.
3. **Confirmación:** vela de rechazo en el VWAP + confluencia (EMA, soporte, [[order-blocks]],
   volumen que baja en el pullback y sube en el rebote).
4. **Entrada:** limit en el VWAP / market en la confirmación. **Stop:** bajo el VWAP y el
   mínimo local (invalidación de la tendencia intradía). **Target:** máximo previo / extensión,
   con trailing por estructura.

**Cuándo evitarlo:** precio serrando alrededor del VWAP sin tendencia (rango) → señales falsas;
o cierres decididos al otro lado del VWAP (cambió el control intradía).

**Regla para el bot:** En tendencia intradía clara, opera el pullback que respeta el VWAP (o VWAP anclado al evento): entra en la confirmación de rechazo con stop al otro lado del VWAP y target al extremo previo con trailing. Si el precio sierra el VWAP sin tendencia o lo pierde con cierres, NONE.

Relacionado: [[vwap]], [[pullback-tendencia]], [[soporte-resistencia-dinamico]], [[sesiones-killzones]], [[confluencia]]

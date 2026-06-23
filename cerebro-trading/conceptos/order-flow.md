---
title: Order flow y agresión (delta)
type: estructura
tags: [order-flow, delta, agresion, compradores, vendedores, absorcion]
bias: [long, short]
regime: [any]
timeframe: [5m, 15m, 1h]
weight: medium
---

# Order flow y agresión (delta)

El order flow mide **quién es agresivo**: compradores que pagan el ask (market buys) vs
vendedores que pegan al bid (market sells). El bot lo aproxima con el desbalance de trades
([[flujo-ballenas]]).

**Conceptos:**
- **Delta:** diferencia entre volumen comprador agresivo y vendedor agresivo. Delta positivo
  fuerte = presión de compra; negativo = presión de venta.
- **Absorción:** mucha agresión en una dirección pero el precio NO se mueve → alguien está
  absorbiendo (órdenes límite grandes). Suele preceder un giro en contra de la agresión.
- **Divergencia de delta:** precio hace nuevo máximo pero el delta no acompaña → compra
  agotándose (posible techo), y viceversa.

**Cómo usarlo:**
- Confirma rupturas: una ruptura con delta/agresión a favor es más fiable.
- Absorción en una zona de oferta/demanda = confluencia fuerte para la reversión.
- Si la agresión contradice tu sesgo, baja la confianza.

**Regla para el bot:** Usa el desbalance comprador/vendedor (proxy de order flow) para confirmar dirección: agresión a favor valida la entrada, absorción o divergencia de delta en una zona avisa de giro. Agresión en contra de tu sesgo = reduce convicción.

Relacionado: [[flujo-ballenas]], [[liquidez]], [[volumen]], [[oferta-demanda]]

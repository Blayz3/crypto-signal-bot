---
title: Tipos de órdenes (market, limit, stop)
type: principio
tags: [ordenes, limit, market, stop, ejecucion, maker, taker]
bias: [long, short]
regime: [any]
timeframe: [any]
weight: high
---

# Tipos de órdenes (market, limit, stop)

Cómo se ENTRA al trade importa tanto como dónde. Elegir bien el tipo de orden mejora el
precio de entrada y ahorra comisiones.

## Tipos
- **Market (a mercado):** ejecuta YA al precio actual. Garantiza entrar, pero pagas el
  spread y comisión **taker**. Útil solo cuando necesitas entrar sí o sí (rara vez).
- **Limit (límite):** colocas el precio al que quieres entrar; ejecuta solo si el precio
  llega ahí. Mejor precio, comisión **maker** (más barata), pero puede no ejecutarse si el
  precio no vuelve. Es la orden correcta para **entrar en una zona/retest**.
- **Stop-market:** se dispara a mercado cuando el precio cruza un nivel. Para **rupturas**
  (entrar cuando rompe) y para el **stop-loss**.
- **Stop-limit:** como la anterior pero coloca una límite al dispararse (controla el precio,
  riesgo de no ejecutar en movimientos rápidos).

## Qué orden usar según el setup (clave)
- **Entradas en zona/retest** (RektProof tercer toque, rechazo en S/R, pullback a EMA,
  order block, fib): **orden LÍMITE** en la zona. No persigas a mercado.
- **Entradas por ruptura** (breakout de rango/triángulo, BOS): **orden STOP** sobre/bajo
  el nivel, para entrar solo si rompe de verdad.
- **Stop-loss:** siempre como orden **stop** en la invalidación.
- **Take-profit:** orden **límite** en el target (o parcial, ver [[gestion-de-posicion]]).

## Comisiones
Las órdenes límite suelen ser **maker** (más baratas o con rebate); las de mercado son
**taker** (más caras). En scalping con muchas operaciones, esto pesa.

**Regla para el bot:** Para entradas en zona/retest propón una orden LÍMITE en el precio de entrada (no market); para entradas por ruptura propón una orden STOP en el nivel. El stop-loss va como orden stop y el target como límite. Indica el tipo de orden en cada señal.

Relacionado: [[oferta-demanda]], [[three-tap-format]], [[rechazo-soporte-resistencia]], [[ruptura-rango]], [[gestion-de-posicion]], [[stop-loss]]

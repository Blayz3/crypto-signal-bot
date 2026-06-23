---
title: Divergencias de RSI
type: patron-vela
tags: [rsi, divergencia, momentum, reversion, agotamiento]
bias: [long, short]
regime: [any]
timeframe: [15m, 1h, 4h]
weight: medium
---

# Divergencias de RSI

Cuando el **precio y el RSI no concuerdan**, el momentum se está agotando — aviso
temprano de posible giro.

- **Divergencia alcista:** precio hace mínimo más bajo, pero RSI hace mínimo más alto.
  La caída pierde fuerza → posible rebote. Buscar en soporte.
- **Divergencia bajista:** precio hace máximo más alto, pero RSI hace máximo más bajo.
  La subida pierde fuerza → posible techo. Buscar en resistencia.

**Cómo usarla bien:**
- Es señal de **agotamiento, no de entrada inmediata**. Esperar confirmación (vela de
  rechazo, ruptura de microestructura).
- Funciona mejor **en niveles clave** y tras movimientos extendidos.
- En tendencia muy fuerte, las divergencias pueden repetirse y fallar — no pelear la
  tendencia solo por una divergencia.

**Regla para el bot:** Trata la divergencia RSI como señal de agotamiento que REFUERZA un rechazo en nivel, no como entrada aislada. No la uses para ir contra una tendencia fuerte sin confirmación.

Relacionado: [[rechazo-soporte-resistencia]], [[tendencia-vs-rango]], [[expectativa-y-winrate]]

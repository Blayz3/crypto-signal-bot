---
title: Premium / Discount (OTE)
type: estructura
tags: [premium, discount, ote, equilibrio, fibonacci, valor]
bias: [long, short]
regime: [trending, ranging]
timeframe: [any]
weight: medium
---

# Premium / Discount (OTE)

Divide un tramo (de mínimo a máximo) por la mitad (**equilibrio = 50%**). Comprar barato y
vender caro se traduce en:

- **Discount (mitad inferior, <50%):** zona "barata" → ahí buscas **LONG**.
- **Premium (mitad superior, >50%):** zona "cara" → ahí buscas **SHORT**.
- **Equilibrio (50%):** zona neutral; evita entrar ahí.

**OTE (Optimal Trade Entry):** la zona de retroceso óptima, típicamente el **Fibonacci
0.62–0.79** del impulso ([[fibonacci]]). Entrar en discount profundo (long) u premium
profundo (short) da el mejor R:R porque el stop queda corto y el target lejos.

**Cómo aplicarlo:**
- En bias alcista, **solo compra en discount** (no persigas en premium).
- En bias bajista, **solo vende en premium**.
- Combina con order block / FVG / liquidez dentro de la zona discount/premium = entrada A+.

**Regla para el bot:** Compra en discount (mitad inferior del tramo) y vende en premium (mitad superior); evita el equilibrio (50%). La zona OTE (fib 0.62–0.79) da el mejor R:R. Entrar en premium para un long (o discount para un short) es perseguir: penalízalo.

Relacionado: [[bias-direccional]], [[fibonacci]], [[order-blocks]], [[rr-minimo]]

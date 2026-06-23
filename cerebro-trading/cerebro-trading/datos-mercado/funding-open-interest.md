---
title: Funding rate y Open Interest
type: estructura
tags: [funding, open-interest, oi, apalancamiento, posicionamiento, squeeze]
bias: [long, short]
regime: [any]
timeframe: [any]
weight: medium
---

# Funding rate y Open Interest

Miden cómo está posicionado el mercado de **futuros** (apalancados). Sirven para detectar
extremos donde el mercado está "cargado" de un lado y vulnerable a un squeeze.

## Funding rate
Pago periódico entre longs y shorts.
- **Funding muy positivo:** demasiados longs pagando → mercado sobre-comprado en futuros →
  riesgo de **long squeeze** (caída brusca al liquidar longs). Cuidado al abrir LONG tarde.
- **Funding muy negativo:** demasiados shorts → riesgo de **short squeeze** (subida brusca).
  Cuidado al abrir SHORT tarde; favorece buscar LONG contrarian con confirmación.
- **Cerca de 0:** equilibrado, sin sesgo.

## Open Interest (OI)
Total de contratos abiertos.
- **OI sube + precio sube:** dinero nuevo entrando, tendencia respaldada.
- **OI sube + precio plano:** acumulación de posiciones → posible movimiento explosivo.
- **OI cae fuerte:** cierre de posiciones / liquidaciones → posible fin de movimiento.

**Regla para el bot:** Evita entrar TARDE en la dirección del funding extremo (riesgo de squeeze en tu contra). Un funding extremo opuesto a tu entrada es viento a favor. OI creciente con tu dirección confirma; OI cayendo resta convicción.

Relacionado: [[00-como-leer-datos]], [[liquidaciones]], [[fear-greed]]

---
title: Flujo de ballenas
type: estructura
tags: [ballenas, whale, flujo, onchain, smart-money, volumen]
bias: [long, short]
regime: [any]
timeframe: [any]
weight: medium
---

# Flujo de ballenas

Las "ballenas" (grandes tenedores) mueven el mercado. Seguir su flujo es el "smart money"
legítimo y público. El bot lo aproxima con **trades grandes y el desbalance
comprador/vendedor** del exchange, y opcionalmente con Whale Alert (movimientos on-chain).

**Cómo leerlo:**
- **Desbalance comprador** (ej. 70% compras vs 30% ventas) en trades grandes → presión
  alcista, apoya LONG.
- **Desbalance vendedor** → presión bajista, apoya SHORT.
- **Entradas a exchanges** (depósitos grandes) suelen preceder ventas (bajista).
  **Salidas de exchanges** (a wallets frías) suelen ser acumulación (alcista).
- Acumulación de ballenas en una zona de demanda = confluencia fuerte con [[oferta-demanda]].

**Cuidado:** el flujo puede ser ruidoso en ventanas cortas. Pesa más cuando es consistente
y coincide con un nivel/zona técnica.

**Regla para el bot:** Usa el desbalance de ballenas como confirmación direccional. Flujo comprador en una zona de demanda refuerza LONG; flujo vendedor en oferta refuerza SHORT. Si las ballenas van en contra de tu sesgo, reduce convicción.

Relacionado: [[00-como-leer-datos]], [[oferta-demanda]], [[volumen]]

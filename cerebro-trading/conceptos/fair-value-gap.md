---
title: Fair Value Gap (FVG / imbalance)
type: setup
tags: [fvg, imbalance, gap, smc, desequilibrio, entrada]
bias: [long, short]
regime: [trending]
timeframe: [5m, 15m, 1h, 4h]
weight: medium
---

# Fair Value Gap (FVG / imbalance)

Un **FVG** es un hueco de "valor justo" que deja un movimiento muy rápido: tres velas donde
la mecha de la 1ª y la 3ª **no se solapan**, dejando un espacio sin negociar (imbalance).
El precio tiende a **regresar a rellenar** ese hueco antes de seguir.

**Identificación:**
- **Bullish FVG:** en un impulso alcista, hueco entre el máximo de la vela 1 y el mínimo de
  la vela 3. Zona de soporte al rellenar → buscar LONG.
- **Bearish FVG:** en impulso bajista, hueco entre el mínimo de la vela 1 y el máximo de la 3.
  Zona de resistencia → buscar SHORT.

**Cómo usarlo:**
- El FVG actúa como **zona de entrada** (limit) en el retroceso, sobre todo si coincide con
  un **order block** o nivel ([[order-blocks]]).
- Un FVG sin rellenar es un **imán**: el precio suele volver a por él.
- No todos se rellenan al 100%; basta con que toque la zona y reaccione.

**Regla para el bot:** Trata un FVG (imbalance de 3 velas) como zona de entrada limit en el retroceso, mejor si coincide con un order block o nivel. FVG sin rellenar = imán de precio, úsalo como target o entrada. Stop al otro lado del FVG/OB.

Relacionado: [[order-blocks]], [[oferta-demanda]], [[tipos-de-orden]], [[liquidez]]

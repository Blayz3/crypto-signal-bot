---
title: Objetivo — PROFIT (no win rate)
type: principio
tags: [objetivo, profit, expectativa, winrate, meta]
bias: [long, short]
regime: [any]
timeframe: [any]
weight: high
---

# Objetivo — PROFIT (no win rate)

**Lo que buscamos es PROFIT, no acertar mucho.** El operador de referencia generó
**+$32.744 (+95%)** con un **win rate de solo 42%** (29 ganados de 69 cerrados,
27 días verdes vs 19 rojos). Es la prueba viva de que **un WR bajo con buen R:R es muy
rentable**: las ganancias grandes pagan las muchas pérdidas pequeñas.

## Qué significa para el bot
- **No rechaces un trade por "WR bajo".** Importa la expectativa: ganar más cuando aciertas
  que lo que pierdes cuando fallas.
- **Deja correr los ganadores** hacia el target completo (lado opuesto del rango / liquidez).
  Corta los perdedores rápido en la invalidación.
- **R:R manda:** prioriza setups con R:R ≥ 2, idealmente 3+. Un solo ganador de 3R cubre
  tres pérdidas de 1R.
- Mide el éxito en **R acumulada y % de cuenta**, no en porcentaje de aciertos.

**Regla para el bot:** El objetivo es maximizar profit (R acumulada), no el win rate. Acepta un WR de ~40% si el R:R es alto. Deja correr ganadores al target, corta perdedores en la invalidación, y prioriza R:R ≥ 2 (mejor 3+).

Relacionado: [[expectativa-y-winrate]], [[plan-de-trading]], [[rr-minimo]], [[proceso-sobre-resultado]]

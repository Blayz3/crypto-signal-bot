---
title: Riesgo de ruina y drawdown
type: estructura
tags: [riesgo-ruina, drawdown, rachas, supervivencia, capital]
bias: [long, short]
regime: [any]
timeframe: [any]
weight: high
---

# Riesgo de ruina y drawdown

El **riesgo de ruina** es la probabilidad de perder tanto capital que ya no puedes operar.
Sobrevivir es la condición #1 para que el edge se materialice a largo plazo.

**La matemática de las rachas:**
- Con WR 50%, una **racha de 7 pérdidas seguidas** ocurre con regularidad en cientos de trades.
- Arriesgando 2% por trade, 7 pérdidas = −14% (recuperable). Arriesgando 20%, 7 pérdidas
  = cuenta destruida.
- **Recuperar un drawdown cuesta más de lo que parece:** perder 50% exige ganar **100%**
  para volver. Perder 20% exige +25%. Por eso proteger el capital > buscar ganancias.

**Reglas de supervivencia:**
- Riesgo bajo y constante por trade (el plan define el %). Nunca subir tamaño tras perder.
- Tope de pérdida diaria/semanal ([[limite-perdida-diaria]]) para no entrar en espiral.
- Asume que las rachas de pérdidas SON normales; el sistema debe aguantarlas.

**Regla para el bot:** Razona siempre asumiendo rachas de pérdidas normales: prioriza la supervivencia del capital sobre maximizar un trade. Riesgo constante y bajo; recuperar drawdowns grandes es exponencialmente más difícil que evitarlos.

Relacionado: [[tamano-posicion]], [[limite-perdida-diaria]], [[expectativa-y-winrate]], [[plan-de-trading]]

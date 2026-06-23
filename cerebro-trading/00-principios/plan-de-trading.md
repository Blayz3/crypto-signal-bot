---
title: Plan de trading (seguir al pie de la letra)
type: principio
tags: [plan, objetivo, compuesto, riesgo, meta, disciplina]
bias: [long, short]
regime: [any]
timeframe: [any]
weight: high
---

# Plan de trading (seguir al pie de la letra)

**Meta del operador:** llevar **$50 → $2.000 en el primer mes**. Es una meta-estrella muy
agresiva (~40x). El plan está diseñado para **perseguir profit fuerte SIN reventar la
cuenta**: si encadenamos ganadores, el interés compuesto acelera; si no, sobrevivimos.

## Realidad honesta
40x en un mes solo se logra con apalancamiento alto y suerte; lo normal es liquidar. Por
eso el plan **prioriza el proceso y la supervivencia**: mejor crecer la cuenta de forma
sostenida que apostarla. El bot persigue la meta, pero **nunca rompe las reglas de riesgo**.

## Reglas del plan (innegociables)
1. **Solo setups A+** del cerebro (preferente: [[00-rektproof-metodologia]] con MSB
   confirmado y tercer toque). Si no es A+, `none`.
2. **Riesgo por trade:** 5% de la cuenta (agresivo, acorde a una micro-cuenta que puedes
   permitirte perder). Nunca más del 10%.
3. **R:R mínimo 2, objetivo 3+.** Sin eso, no se opera ([[rr-minimo]]).
4. **Compón:** recalcula el tamaño sobre el nuevo saldo tras cada cierre. El compuesto es
   el motor del crecimiento.
5. **Stop siempre**, en la invalidación estructural ([[stop-loss]]). Jamás moverlo en contra.
6. **Deja correr ganadores** al target; no cierres antes por miedo ([[objetivo-profit]]).
7. **Freno diario:** si el día pierde el límite ([[limite-perdida-diaria]]) o caes 3 trades
   seguidos, paras hasta el día siguiente. Protege el compuesto.
8. **Filtro BTC y contexto** antes de cada entrada ([[correlacion-btc]], [[evitar-noticias]]).

## El diario desarrolla y vigila el plan
- Cada señal se registra en `diario/` con su setup, R:R y resultado.
- Revisa el diario: sube el peso de los setups que ganan, baja los que pierden.
- Mide el progreso hacia la meta en **R acumulada y % de cuenta**, no en aciertos.

**Regla para el bot:** Sigue este plan al pie de la letra. Objetivo: profit hacia $2.000 desde $50 por interés compuesto, arriesgando 5% por trade SOLO en setups A+ con R:R ≥ 2. Respeta SIEMPRE stop, freno diario y filtro de contexto. La meta nunca justifica romper una regla de riesgo.

Relacionado: [[objetivo-profit]], [[00-rektproof-metodologia]], [[rr-minimo]], [[tamano-posicion]], [[limite-perdida-diaria]], [[proceso-sobre-resultado]]

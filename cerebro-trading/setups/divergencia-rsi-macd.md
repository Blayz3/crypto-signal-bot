---
title: Divergencia de momentum (RSI/MACD) como confirmación de reversión
type: setup
tags: [divergencia, rsi, macd, momentum, reversion, agotamiento, confirmacion]
bias: [long, short]
regime: [ranging, reversal]
timeframe: [15m, 1h, 4h]
weight: medium
---

# Divergencia de momentum (RSI/MACD) como confirmación de reversión

La divergencia avisa de **agotamiento**: el precio hace un nuevo extremo pero el momentum
(RSI/MACD) NO lo acompaña → la fuerza detrás del movimiento se está apagando. NO es una señal
de entrada por sí sola: es un **filtro de confirmación** que se combina con un nivel y un gatillo.

## Playbook (LONG en un fondo; espejo para SHORT en un techo)
1. **Extremo en un nivel:** el precio hace un mínimo más bajo (LL) en un soporte HTF / VAL /
   [[naked-poc]] / extremo de rango.
2. **Divergencia alcista:** RSI o MACD hace un mínimo MÁS ALTO en ese segundo mínimo (el
   momentum no confirma). (Regular = reversión; oculta = continuación.)
3. **Gatillo:** NO entres solo por la divergencia. Espera confirmación: ruptura de la línea de
   tendencia bajista menor, vela de rechazo, o un [[swing-failure-sfp]] en el nivel.
4. **Entrada:** en el gatillo. **Stop:** bajo el mínimo del precio (la divergencia se invalida
   si hace un mínimo más bajo SIN divergencia). **Target:** primera resistencia / media / VAH.

**Cuándo evitarlo:** en tendencia MUY fuerte, la divergencia puede repetirse varias veces antes
de girar ("el momentum puede seguir divergiendo"). Úsala solo con nivel + gatillo, nunca sola.

**Regla para el bot:** Usa la divergencia RSI/MACD SOLO como confirmación de agotamiento en un nivel clave, nunca como entrada aislada: requiere nivel HTF + divergencia + un gatillo (ruptura de tendencia menor, vela de rechazo o SFP). Entra en el gatillo con stop tras el extremo del precio; sin nivel o sin gatillo, o en tendencia muy fuerte en contra, NONE.

Relacionado: [[momentum-vs-reversion]], [[swing-failure-sfp]], [[fade-rechazo-nivel]], [[confluencia]]

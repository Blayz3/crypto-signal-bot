---
title: Momentum continuación (MACD)
type: setup
tags: [momentum, macd, adx, continuacion, tendencia, momentum-macd]
bias: [long, short]
regime: [trending]
timeframe: [15m, 1h, 4h]
weight: high
---

# Momentum continuación (MACD)

**El setup #1 del cerebro por expectativa real** ([[setups-rendimiento]]: mejor PF del
auto-backtest). Operar la continuación de una tendencia con momentum vivo: no adivinas
giros, te subes a lo que ya se mueve. En crypto las tendencias con ADX alto recorren
mucho más de lo que parece razonable — ahí viven los runners de 4-6R que pagan el mes.

## Playbook (ejecución paso a paso)

1. **CONTEXTO:** ADX(1h) ≥ 25 (A+ si ≥ 35 y subiendo), EMAs 20>50>200 en 1h y 4h (espejo para short), precio sobre EMA20. En alts: BTC en la misma dirección o neutro — nunca contra un BTC tendencial opuesto.
2. **MOMENTUM VIVO:** histograma MACD(1h) del lado correcto Y expandiéndose en las últimas 2-3 velas. Histograma contrayéndose = momentum muriendo → no entrar, aunque la tendencia siga.
3. **GATILLO (dos variantes):** (a) ruptura del último máximo menor con cuerpo y volumen, o (b) micro-pullback ≤0.382 del último impulso que aguanta la EMA20 y rompe el high de la vela de pausa.
4. **NO PERSEGUIR:** si el precio está extendido a más de 2.5×ATR de la EMA20, llegaste tarde → espera el micro-pullback o none. Perseguir extensión es la forma #1 de regalar R.
5. **STOP:** 2×ATR desde la entrada o bajo el último swing menor, lo que sea más lógico estructuralmente.
6. **TARGETS:** TP1 a 2R (≥2R o none). A +1R stop a BE. En 2R cierra 50% y deja correr el resto con trailing por estructura (bajo cada HL) o cierre de 1h contra la EMA20 — aquí salen los 4-6R.
7. **NO OPERAR:** ADX < 25, MACD divergiendo contra el precio en 4h, funding extremo a favor de tu lado (>0.05% en long = combustible para squeeze en contra), fin de semana con volumen muerto, vela de noticias.

**Regla para el bot:** En tendencia con ADX≥25 (ideal ≥35) y MACD expandiéndose, opera la continuación: entrada en ruptura de máximo menor o micro-pullback a EMA20, stop 2×ATR, BE a +1R, parcial en 2R y trailing del resto a 4-6R. Nunca entres extendido >2.5×ATR de la EMA20 ni con el histograma MACD contrayéndose. Es el setup de mayor expectativa: dale prioridad.

Relacionado: [[setups-rendimiento]], [[configuracion-optima]], [[pullback-tendencia]], [[trailing-stop]], [[correlacion-btc]]

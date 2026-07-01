---
title: Swing Failure Pattern (SFP) — barrido de liquidez + reclaim
type: setup
tags: [sfp, swing-failure, liquidez, barrido, sweep, reclaim, reversion, stop-hunt]
bias: [long, short]
regime: [ranging, reversal]
timeframe: [15m, 1h, 4h]
weight: high
---

# Swing Failure Pattern (SFP) — barrido de liquidez + reclaim

En crypto los grandes players **cazan stops**: el precio rompe brevemente un máximo/mínimo
evidente (donde se acumulan stops y stops-loss), toma esa liquidez y **falla**, volviendo
dentro del rango. Ese "barrido + reclaim" marca reversión de alta probabilidad. Es la versión
accionable del stop-hunt / [[liquidez]].

## Playbook (LONG en un mínimo; espejo para SHORT en un máximo)
1. **Nivel de liquidez:** un mínimo swing claro (igual/doble suelo, mínimo del rango, VAL,
   [[naked-poc]]) donde es obvio que hay stops debajo.
2. **Barrido (sweep):** una vela PERFORA ese mínimo (mecha por debajo) pero **CIERRA de vuelta
   por encima** — falla en sostener el nuevo mínimo. Ideal con divergencia ([[divergencia-rsi-macd]])
   o pico de volumen/absorción.
3. **Reclaim:** el precio recupera el nivel y confirma con una vela alcista / rechazo.
4. **Entrada:** limit/market en el reclaim del nivel. **Stop:** debajo de la mecha del barrido
   (muy ajustado → R:R alto). **Target:** lado opuesto del rango / próxima liquidez (VAH, máximo).

**Mejor contexto:** contra un extremo del rango o en confluencia con soporte HTF; a favor del
sesgo mayor si es posible. Evítalo en tendencia fuerte en contra (el "barrido" puede ser ruptura real).

**Regla para el bot:** Cuando el precio perfore un máximo/mínimo de liquidez evidente pero CIERRE de vuelta dentro del rango (barrido fallido), entra en el reclaim en dirección contraria al barrido, con stop apretado tras la mecha y target a la liquidez opuesta (R:R alto). Sube la convicción con divergencia o volumen de absorción; en tendencia fuerte contraria sin reclaim claro, NONE.

Relacionado: [[liquidity-grab-reversal]], [[liquidez]], [[rango-y-desviacion]], [[divergencia-rsi-macd]], [[volume-profile]]

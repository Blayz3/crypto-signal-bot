---
title: Pullback a EMA en tendencia
type: setup
tags: [pullback, tendencia, ema, continuacion, trend-following]
bias: [long, short]
regime: [trending]
timeframe: [15m, 1h, 4h]
weight: medium
---

# Pullback a EMA en tendencia

El setup de mayor expectativa: operar **a favor de la tendencia** comprando/vendiendo
un retroceso a una media móvil dinámica. "The trend is your friend".

**Condiciones (long; invertir para short):**
1. **Tendencia alcista clara:** EMAs alineadas (20 > 50 > 200) y precio sobre EMA200.
2. El precio **retrocede** a la EMA20 o EMA50 (zona de valor), sin romper estructura.
3. **Confirmación de rebote** en la zona: vela alcista de rechazo (pin bar / engulfing),
   o RSI rebotando desde ~40-50 (no necesita sobreventa).
4. Ideal: la EMA coincide con un soporte previo o nivel clave (confluencia).

**Entrada:** al confirmar el rebote en la EMA.
**Stop:** debajo del mínimo del pullback / debajo de la EMA50.
**Target:** el máximo reciente y, si rompe, extensión hacia el siguiente nivel. R:R ≥ 2 habitual.

**Cuándo NO operarlo:** en rango (EMAs planas y entrelazadas) o si el pullback rompe la
EMA200 / la estructura (eso ya no es pullback, es posible cambio de tendencia).

## Playbook (ejecución paso a paso)

1. **CONTEXTO:** EMAs 20>50>200 en 1h Y 4h (espejo para short), ADX(1h) ≥ 25, precio sobre EMA200. En alts, BTC no en contra (si BTC hace mínimos decrecientes en 1h, no busques longs en alts).
2. **ZONA:** retroceso a EMA20/50 de 1h que coincida con un nivel real (soporte previo, VAL, nPOC, 0.382-0.618 del impulso). Sin nivel coincidente la calidad baja a B → exige confluencia 5+ o none.
3. **GATILLO:** vela de rechazo CERRADA en la zona — pin bar (mecha ≥2× cuerpo) o engulfing — con volumen ≥ promedio, RSI(1h) girando desde 40-50. Nunca entres con la vela en curso.
4. **ENTRADA:** limit en el 50% de la vela de rechazo; market solo si el momentum es fuerte al cierre de la confirmación.
5. **STOP:** bajo el mínimo del pullback − 0.25×ATR de margen anti-mecha. Si el stop queda a más de 2×ATR, el trade no es A+ → none.
6. **TARGETS:** TP1 = máximo previo (debe dar ≥2R o none). A +1R stop a BE. En TP1 cierra 50% y traila el resto bajo cada HL (o cierre de 1h bajo EMA20) hacia 3-6R.
7. **NO OPERAR:** EMAs planas/entrelazadas, pullback que cierra bajo la EMA200, tercer+ toque de la misma EMA en la misma pierna (se gasta), funding extremo en contra, vela de noticias.

**Regla para el bot:** En tendencia con EMAs alineadas, prioriza LONG en pullbacks a EMA20/50 con vela de rechazo (y SHORT en el caso inverso). Evítalo en rango.

Relacionado: [[tendencia-vs-rango]], [[engulfing]], [[pin-bar]], [[rr-minimo]]

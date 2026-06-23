---
title: Breakout + retest (continuación)
type: setup
tags: [breakout, retest, ruptura, continuacion, volumen, role-reversal]
bias: [long, short]
regime: [trending, ranging]
timeframe: [15m, 1h, 4h]
weight: medium
---

# Breakout + retest (continuación)

Operar la **ruptura confirmada** de un nivel/estructura y entrar en su **retest**. Combina
la fuerza del breakout con la seguridad del retest.

**Secuencia (LONG; espejo para SHORT):**
1. **Nivel claro:** resistencia de rango, máximo previo, línea de tendencia, o ruptura de
   estructura (BOS, [[estructura-de-mercado]]).
2. **Breakout con cierre y volumen:** vela que cierra por encima con volumen sobre el
   promedio ([[volumen]]). Sin volumen → sospecha de fakeout.
3. **Retest:** el precio vuelve al nivel roto, que ahora actúa como **soporte** (role
   reversal, [[retest]]).
4. **Entrada:** limit en el retest + confirmación (vela de rechazo). **Stop:** de vuelta bajo
   el nivel. **Target:** siguiente nivel / liquidez / extensión.

**Diferencia con ruptura de rango:** aquí el énfasis es el **retest** como gatillo (más
seguro), no entrar en la vela de ruptura.

**Cuándo evitarlo:** breakout sin volumen, o contra el bias del timeframe alto
([[bias-direccional]]) — suelen ser trampas.

## Playbook (ejecución paso a paso)

1. **NIVEL:** marca el nivel ANTES de la ruptura: resistencia tocada ≥2 veces, máximo de rango, o BOS. Niveles redondos y VAH/nPOC suman.
2. **RUPTURA VÁLIDA:** vela de 1h que CIERRA fuera del nivel con volumen ≥1.5× promedio y cuerpo dominante (no mecha). Cierre marginal o sin volumen = probable fakeout → no perseguir.
3. **RETEST:** coloca limit en el nivel roto (role reversal). Válido hasta 0.25×ATR de penetración. Si el precio se va sin retestear, lo dejaste pasar — NUNCA entres tarde por FOMO.
4. **CONFIRMACIÓN en el retest:** rechazo visible (mecha, pin, delta de volumen) y que el retest llegue dentro de las siguientes ~10 velas; un retest muy tardío pierde fuerza.
5. **STOP:** al otro lado del nivel − 0.5×ATR adicional. Si re-cierra dentro del rango previo, la ruptura falló: salir sin esperar el stop.
6. **TARGETS:** TP1 = proyección del rango o siguiente liquidez (≥2R o none). A +1R stop a BE; parcial en TP1, trailing del resto por estructura.
7. **NO OPERAR:** contra el bias del 4h, rupturas en fin de semana con volumen muerto, tercera ruptura del mismo nivel en pocas horas (chop), ni durante vela de noticias.

**Regla para el bot:** Opera rupturas con cierre + volumen, pero entra en el RETEST del nivel roto (no en la vela de ruptura), a favor del bias del HTF. Stop de vuelta al otro lado del nivel. Sin volumen o contra el HTF, descártalo.

Relacionado: [[retest]], [[ruptura-rango]], [[estructura-de-mercado]], [[bias-direccional]], [[volumen]]

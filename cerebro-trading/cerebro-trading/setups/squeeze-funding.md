---
title: Squeeze de funding (contrarian crypto)
type: setup
tags: [funding, squeeze, open-interest, liquidaciones, contrarian, crypto]
bias: [long, short]
regime: [any]
timeframe: [1h, 4h]
weight: medium
---

# Squeeze de funding (contrarian crypto)

Setup 100% crypto: cuando el funding se va a un extremo con el open interest cargado,
el lado masificado es **combustible de liquidaciones**. El mercado caza ese lado. Tú
entras con la cascada a tu favor, no contra ella. Usa los datos de
[[funding-open-interest]] y [[liquidaciones]] que el bot ya recibe.

## Playbook (ejecución paso a paso)

1. **DETECCIÓN (long squeeze; espejo para short):** funding ≤ −0.03%/8h sostenido (shorts pagando por estar cortos) + OI alto o subiendo = muchos shorts apalancados atrapables.
2. **UBICACIÓN:** el precio debe estar EN un nivel comprable — soporte mayor, VAL, nPOC inferior, o tras un sweep de mínimos ([[liquidity-grab-reversal]]). Funding extremo en caída libre sin nivel = cuchillo cayendo → none.
3. **GATILLO:** sweep de mínimos que recupera, o CHoCH alcista en 1h, o cascada de liquidaciones de shorts ya iniciada (liquidaciones short > 2× long en la última hora). Cualquiera confirma; sin gatillo no hay trade.
4. **CONFLUENCIA EXTRA:** Fear&Greed < 25 y ballenas comprando elevan a A+. Si las ballenas venden fuerte, none — no pelees contra el flujo real.
5. **STOP:** bajo el nivel/mecha del sweep − 0.25×ATR. La invalidación es perder el nivel, no un % arbitrario.
6. **TARGETS:** primera liquidez arriba (EQH, VAH, nPOC superior) — los squeezes recorren rápido; suele dar 2.5-4R. A +1R BE; parcial en 2R; el resto corre mientras el funding siga negativo.
7. **NO OPERAR:** funding neutro (−0.01 a +0.01, no hay combustible), OI cayendo (ya se desapalancó), contra una tendencia 4h fuerte con ADX > 35, o sin nivel claro debajo.

**Regla para el bot:** Con funding ≤ −0.03%/8h + OI alto + precio en soporte/VAL/nPOC y gatillo (sweep recuperado, CHoCH o cascada de liquidaciones de shorts), opera el squeeze long con stop bajo el nivel y target en la liquidez superior (espejo para short con funding ≥ +0.05%). Sin nivel o con ballenas en contra: none. Funding neutro = no hay combustible = no existe este setup.

Relacionado: [[funding-open-interest]], [[liquidaciones]], [[liquidity-grab-reversal]], [[flujo-ballenas]], [[volume-profile]]

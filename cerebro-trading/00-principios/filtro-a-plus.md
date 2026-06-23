---
title: Filtro A+ — la puerta del PF>3
type: principio
tags: [filtro, a-plus, calidad, pf, confluencia, seleccion, none]
bias: [long, short]
regime: [any]
timeframe: [any]
weight: high
---

# Filtro A+ — la puerta del PF > 3

El PF > 3 y los 120R/mes ([[meta-mensual]]) no salen de un indicador mágico: salen de
**rechazar el 90% de los candidatos**. Esta es la puerta que TODO trade debe cruzar.
Si falla UNA condición → `none`. Decir "none" es gratis; un trade B− cuesta R real.

## Las 5 condiciones (todas obligatorias)
1. **Confluencia ≥ 3 factores independientes validados por la IA** (ideal 4+): tendencia,
   momentum, nivel de Volume Profile/nPOC, ballenas, funding, sentimiento ([[confluencia]]).
   El conteo automático es la base; la IA debe validar que los factores aplican de verdad.
2. **R:R ≥ 2 al target conservador** y estructura con espacio a 3R+ ([[rr-minimo]]).
3. **Setup con expectativa positiva** según [[setups-rendimiento]] (momentum-macd,
   pullback-ema). Los setups débiles (retest, ruptura, rechazo-sr, rsi-reversion) exigen
   confluencia 5+ o se descartan.
4. **A favor de la tendencia mayor** (EMA200 del TF alto, ADX ≥ 25). Contra-tendencia solo
   con liquidity grab + nivel mayor + datos de mercado a favor ([[liquidity-grab-reversal]]).
5. **Sin noticia de alto impacto inminente** ni vela de noticias en curso ([[evitar-noticias]]).

## La gestión que convierte A+ en PF>3
- Stop en la invalidación (~1.5-2×ATR). Nunca se aleja.
- **BE a +1R** → recorta la pérdida media muy por debajo de 1R.
- **Parcial en 2R, trailing del resto a 3-6R** → sube la ganancia media a 2.5R+.
- WR ~40-45% × ganancia media 2.5R / pérdida media ~0.7R ⇒ PF ≈ 3. Esa es la fórmula.

**Regla para el bot:** Aplica el FILTRO A+ antes de cualquier señal: (1) confluencia ≥3 factores que TÚ valides (ideal 4+), (2) R:R ≥2 con espacio estructural a 3R+, (3) setup de expectativa positiva (los débiles exigen confluencia 5+), (4) a favor de tendencia mayor con ADX≥25 (contra-tendencia solo con liquidity grab + nivel mayor + datos a favor), (5) sin noticias inminentes. Si falla UNA condición: none. En cada señal define el plan: BE a +1R, parcial en 2R, trailing a 3-6R.

Relacionado: [[meta-mensual]], [[confluencia]], [[rr-minimo]], [[setups-rendimiento]], [[gestion-de-posicion]], [[objetivo-profit]]

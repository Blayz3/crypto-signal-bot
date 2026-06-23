---
title: R:R mínimo
type: riesgo
tags: [riesgo, rr, target, recompensa]
bias: [long, short]
regime: [any]
timeframe: [any]
weight: high
---

# R:R mínimo (riesgo/beneficio)

El R:R compara lo que arriesgas (entrada→stop) con lo que buscas (entrada→target).

```
R:R = |target − entrada| / |entrada − stop|
```

**Umbrales del bot (modo PF>3):**
- **R:R < 2 → no operar.** Con nuestro WR (~40-45%) no alimenta un PF > 3.
- **R:R ≥ 2 → mínimo aceptable**, y solo si la estructura deja espacio para que el
  runner llegue a 3R+ (sin resistencia/soporte mayor estorbando antes).
- **R:R ≥ 3 estructural → A+.**

**El target debe ser realista**, anclado a estructura (siguiente soporte/resistencia,
máximo/mínimo previo, extensión), no un número que "haga ver bien" el R:R. Un target
inalcanzable infla el R:R en papel pero nunca se cobra.

**Truco:** primero marca el stop lógico (invalidación) y el target lógico (siguiente
nivel). Si el R:R resultante es pobre, el trade no sirve aunque la dirección sea correcta.

**Regla para el bot:** Calcula R:R con stop y target anclados a estructura real. Rechaza (action: none) cualquier setup con R:R < 2; exige que la estructura deje espacio a 3R+ para el runner. No infles el target para forzar el R:R.

Relacionado: [[expectativa-y-winrate]], [[stop-loss]], [[niveles-clave]]

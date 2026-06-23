---
title: Expectativa y Win Rate
type: principio
tags: [expectativa, winrate, rr, matematica]
bias: [long, short]
regime: [any]
timeframe: [any]
weight: high
---

# Expectativa y Win Rate

El WR por sí solo NO dice si una estrategia es rentable. Lo que importa es la
**expectativa** (cuánto esperas ganar por trade en promedio):

```
Expectativa = (WR × ganancia_media) − (LR × pérdida_media)
```

donde LR = 1 − WR (tasa de pérdida).

**Implicación clave:** con un buen R:R, un WR bajo sigue siendo muy rentable.

| Win Rate | R:R necesario para break-even | Con R:R 2.0 → |
|---|---|---|
| 30% | 2.33 | pierde |
| 40% | 1.50 | **gana** |
| 50% | 1.00 | **gana mucho** |
| 60% | 0.67 | **gana mucho** |

Un sistema con **40% WR y R:R 2.5 es rentable**. Por eso el bot debe priorizar
entradas con buen R:R aunque no sean "seguras", y rechazar las de R:R pobre aunque
se vean probables.

**Invalidación de una buena entrada:** si para alcanzar el target el R:R cae bajo
~1.5, mejor no operar — el riesgo no compensa.

**Regla para el bot:** No persigas WR alto a costa del R:R. Rechaza cualquier setup con R:R < 1.5. Prefiere 2R o más. Un WR de 40-50% con R:R ≥ 2 es excelente.

Relacionado: [[rr-minimo]], [[proceso-sobre-resultado]], [[tamano-posicion]]

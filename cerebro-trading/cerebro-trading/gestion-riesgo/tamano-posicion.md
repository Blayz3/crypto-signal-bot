---
title: Tamaño de posición
type: riesgo
tags: [riesgo, posicion, capital, sizing]
bias: [long, short]
regime: [any]
timeframe: [any]
weight: high
---

# Tamaño de posición

Nunca arriesgar más del **0.5%–1% del capital por operación**. Esto permite
sobrevivir rachas de pérdidas (con 1% por trade, 10 pérdidas seguidas = −10%, recuperable).

**El tamaño se deriva del stop, no al revés:**

```
riesgo_$  = capital × % riesgo            (ej. 1000 × 1% = 10$)
distancia = |entrada − stop| / entrada     (ej. 2% del precio)
tamaño_posición_$ = riesgo_$ / distancia   (ej. 10 / 0.02 = 500$)
```

Así, una entrada con stop lejano automáticamente usa menos tamaño, manteniendo el
riesgo constante en $.

**Errores que destruyen cuentas:**
- Tamaño fijo sin importar el stop → riesgo variable e incontrolado.
- Apalancamiento alto que convierte un −2% en liquidación.
- "Recuperar" subiendo el tamaño tras una pérdida (martingala).

> **Nota:** el % de riesgo lo fija el [[plan-de-trading]] vigente. El principio general
> conservador es ≤1%, pero una micro-cuenta agresiva puede usar más (el plan actual usa
> 5%). El plan manda sobre este número; el resto de reglas (stop primero, no martingala)
> no cambian.

**Regla para el bot:** Define siempre el stop antes que el tamaño. Arriesga el % que indique el plan de trading vigente (por defecto ≤1%; plan actual 5%). Reporta el stop como % del precio para calcular la posición. Nunca aumentes tamaño tras una pérdida.

Relacionado: [[stop-loss]], [[rr-minimo]], [[limite-perdida-diaria]]

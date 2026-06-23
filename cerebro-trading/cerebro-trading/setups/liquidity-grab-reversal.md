---
title: Liquidity grab + reversión (turtle soup)
type: setup
tags: [liquidez, sweep, reversion, turtle-soup, stop-hunt, choch]
bias: [long, short]
regime: [ranging, trending]
timeframe: [5m, 15m, 1h, 4h]
weight: high
---

# Liquidity grab + reversión (turtle soup)

Uno de los setups de mayor probabilidad: el precio **barre la liquidez** de un extremo
(stop hunt) y **revierte**. Operas la vuelta, no el barrido.

**Secuencia (para LONG; espejo para SHORT):**
1. **Liquidez identificada:** mínimos iguales (EQL) o un mínimo obvio con stops debajo
   ([[liquidez]]).
2. **Sweep:** el precio pincha por debajo, toma la liquidez (mecha) y **no sostiene**.
3. **Confirmación:** vuelve dentro y hace **CHoCH/MSB** al alza ([[msb-quiebre-estructura]]).
4. **Entrada:** limit en el order block / FVG que dejó el impulso de reversión.
5. **Stop:** bajo el mínimo del sweep (la mecha). **Target:** la liquidez opuesta (máximos).

**Por qué funciona:** el smart money necesita liquidez para entrar; provoca el barrido para
llenar y luego mueve el precio en la dirección real. Tú entras *después* del barrido, con la
trampa ya ejecutada.

**Filtros:** mejor en confluencia con premium/discount (sweep en discount → long) y con
sentimiento extremo. Evítalo si no hay CHoCH (sin confirmación, el barrido puede continuar).

## Playbook (ejecución paso a paso)

1. **MAPEA LA LIQUIDEZ:** mínimos iguales (EQL), mínimo obvio de rango, o low de sesión asiática — ahí viven los stops. En crypto los sweeps abundan en NY open y cierres de vela diaria.
2. **SWEEP:** mecha que pincha el nivel y CIERRA de vuelta dentro (en 15m o 1h). Cierre por debajo sostenido = no es sweep, es ruptura → none.
3. **CONFIRMACIÓN OBLIGATORIA:** CHoCH/MSB — el precio rompe el último máximo menor del movimiento bajista con cuerpo. Sin CHoCH no hay trade, aunque la mecha sea perfecta.
4. **ENTRADA:** limit en el order block / FVG que dejó el impulso del CHoCH (típicamente 0.5-0.79 del impulso). No market en mitad del impulso.
5. **STOP:** bajo la mecha del sweep − 0.25×ATR. Es la invalidación natural: si la barren de nuevo, la idea murió.
6. **TARGETS:** la liquidez opuesta (EQH/máximo del rango). Suele dar 3R+; si no da ≥2R, none. A +1R BE; parcial en 2R; resto corre al target completo.
7. **FILTROS PRO:** sweep en discount (bajo el 50% del rango) para long, mejor con miedo extremo o funding negativo (combustible de squeeze) y ballenas comprando. Evítalo si BTC está rompiendo estructura en contra.

**Regla para el bot:** Detecta barridos de liquidez (mecha que pincha un mínimo/máximo obvio y revierte) + CHoCH de confirmación → entra a favor de la reversión con stop tras la mecha y target en la liquidez opuesta. Nunca entres durante el barrido; espera la vuelta confirmada.

Relacionado: [[liquidez]], [[msb-quiebre-estructura]], [[order-blocks]], [[acumulacion-distribucion]], [[premium-discount]]

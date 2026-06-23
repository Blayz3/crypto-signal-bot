---
title: Market Profile (VaH / PoC / VaL)
type: estructura
tags: [market-profile, vah, poc, val, valor, volumen, rektproof]
bias: [long, short]
regime: [ranging, trending]
timeframe: [1h, 4h, 1d]
weight: medium
---

# Market Profile (VaH / PoC / VaL)

El perfil de mercado describe **dónde se negoció más volumen** (dónde está el "valor").
Da niveles de referencia que se combinan con los rangos del método RektProof.

- **PoC (Point of Control):** el precio con mayor volumen negociado. Imán: el precio
  tiende a volver a él. Suele actuar como soporte/resistencia fuerte.
- **VaH (Value Area High):** límite superior de la zona de valor (~70% del volumen).
- **VaL (Value Area Low):** límite inferior de la zona de valor.

## Cómo usarlo
- **Dentro del valor (entre VaH y VaL):** mercado equilibrado → comportamiento de rango
  (operar rechazos de VaH/VaL hacia el PoC).
- **Fuera del valor:** desbalance → puede tender; las **desviaciones** sobre VaH o bajo
  VaL son zonas típicas de barrido de liquidez antes del MSB.
- VaH/VaL suelen coincidir con los extremos del rango → **confluencia** con la zona S/D.

**Regla para el bot:** Usa PoC como imán/soporte-resistencia y VaH/VaL como extremos de valor. Una desviación fuera de VaH/VaL que coincide con el extremo del rango refuerza la zona de oferta/demanda. El precio tiende a volver al PoC.

Relacionado: [[rango-y-desviacion]], [[oferta-demanda]], [[niveles-clave]], [[volumen]]

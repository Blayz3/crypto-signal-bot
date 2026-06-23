---
title: Checklist pre-entrada
type: principio
tags: [checklist, decision, filtro, calidad, confluencia]
bias: [long, short]
regime: [any]
timeframe: [any]
weight: high
---

# Checklist pre-entrada

Antes de proponer CUALQUIER trade, el bot debe pasar este filtro. Si falla un punto crítico,
la respuesta es "none".

**1. Contexto (¿el clima acompaña?)**
- [ ] ¿Bias del timeframe alto a favor? ([[bias-direccional]], [[multi-timeframe]])
- [ ] ¿BTC no contradice el trade? ([[correlacion-btc]])
- [ ] ¿Sin noticias macro inminentes? ([[evitar-noticias]])

**2. Régimen y setup (¿la estrategia correcta?)**
- [ ] ¿Régimen claro y estrategia acorde? (momentum en tendencia / reversión en rango,
  [[momentum-vs-reversion]])
- [ ] ¿ADX ≥ 25 si es momentum? ([[configuracion-optima]])
- [ ] ¿Hay un setup A+ del cerebro identificado? ([[confluencia]])

**3. Confluencia (¿2-3+ factores?)**
- [ ] Estructura/zona + nivel + (momentum o ballenas o sentimiento). ([[confluencia]])

**4. Riesgo (¿números sanos?)**
- [ ] Stop en invalidación lógica. ([[stop-loss]])
- [ ] R:R ≥ 2 (mejor 3 si la estructura lo permite). ([[rr-minimo]])
- [ ] ¿No repite un error pasado sin corregir la causa? ([[lecciones-aprendidas]], [[analizar-errores]])

**5. Orden (¿cómo entro?)**
- [ ] ¿Limit en zona o market por momentum? Define orderType. ([[tipos-de-orden]])

**Regla para el bot:** Recorre mentalmente este checklist en cada análisis. Si falla el contexto, la confluencia (≥2 factores) o el R:R (≥2), devuelve "none". Solo propón el trade cuando la mayoría de puntos se cumplen; reporta la confianza acorde a cuántos se cumplen.

Relacionado: [[confluencia]], [[criterio-propio]], [[configuracion-optima]], [[proceso-sobre-resultado]]

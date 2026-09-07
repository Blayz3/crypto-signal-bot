---
title: Autoentrenamiento (aprendido de mis resultados)
type: principio
tags: [autoentrenamiento, aprendizaje, seleccion, cuarentena, mejora]
bias: [long, short]
regime: [any]
timeframe: [any]
weight: high
---

# Autoentrenamiento (aprendido de mis resultados)

Generado el 2026-09-07 con los resultados REALES de la SEMANA (2026-08-31 → 2026-09-07, 11 trades, +6.2R).
El bot se entrena solo CADA SEMANA: NO abandona los setups, los PERFECCIONA — prioriza lo que
gana, exige la condición que faltó en lo que pierde, y sube la exigencia si no fue rentable.
**Nivel de exigencia actual: 5/5.**

## ✅ Setups a PRIORIZAR (ganaron con datos reales)
- EMA200 pullback continuation: 3 trades, +2.3R, WR 33% → más confianza

## 🔧 Setups a AFINAR (perdieron — NO los abandones: exige la confluencia que faltó)
- (ninguno con muestra suficiente esta semana)

## 📝 Lecciones de las pérdidas de la semana
- Causa:** Entré en un pull‑back justo bajo la EMA20 sin esperar una confirmación de ruptura y con el stop demasiado ajustado en zona de ruido, de modo que el precio volvió a probar la EMA y activó el stop antes de que el impulso real se desarrollara.   **Lección:** Solo abre cuando el precio cierre por encima de la EMA20 (o cualquier nivel clave) y coloca el stop al menos 2 × ATR fuera de la zona de congestión; exige una confluencia extra (≥6 factores) para validar pull‑backs dentro de tendencias.
- Causa:** Falta de gestión activa – el stop quedó estático y no se aseguró ni se movió a break‑even cuando el precio alcanzó +1 R, por lo que la reversión borró toda la ganancia.   **Lección:** Implementa la regla de “stop a BE y parcial a 1 R” tan pronto como el trade muestra +1 R; ningún setup es válido sin un plan de salida que proteja la ganancia.
- Causa:** el stop estaba demasiado ajustado a la volatilidad y la entrada se realizó justo en la zona de VAH, sin una confirmación estructural adicional (ruptura de bloque de órdenes o nivel de soporte/resistencia claro), lo que dejó al trade vulnerable a un rebote rápido.
- Causa:** La gestión de salida fue insuficiente; al alcanzar +1 R no se trasladó el stop a breakeven ni se aseguró una parte de la posición, dejando el trade vulnerable a la reversión.   **Lección:** En cualquier operación que alcance al menos 1 R, mueve inmediatamente el stop a breakeven y/o asegura una fracción (ej. 50 %) antes de intentar el objetivo completo. Esto protege el capital y convierte los pequeños avances en R positivos garantizados.
- Causa:** El stop se colocó demasiado cerca de la EMA 20 (≈ 0.8 % bajo el precio) sin respetar la volatilidad (≈ 2×ATR) y la entrada estuvo justo en la VAH, una zona de resistencia estructural que anuló la confluencia de EMA/ADX.   **Lección:** Usa siempre un stop ≥ 2×ATR y evita abrir
- Causa:** Entré con confluencia insuficiente; el pullback a la EMA200 no estaba respaldado por un ADX

**Regla para el bot:** Aplica lo aprendido de MIS resultados: prioriza los setups ganadores con más confianza; los que perdieron NO se abandonan — exígeles confluencia ≥6 y la condición que faltó según las lecciones. Confluencia mínima de 5 factores en CUALQUIER trade (nivel de exigencia 5/5). Objetivo: PERFECCIONAR los setups semana a semana para perder menos de lo evitable; ante la duda, NONE.

Relacionado: [[configuracion-optima]], [[setups-rendimiento]], [[lecciones-aprendidas]], [[confluencia]], [[meta-mensual]]

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

Generado el 2026-10-26 con los resultados REALES de la SEMANA (2026-10-19 → 2026-10-26, 14 trades, +1.4R).
El bot se entrena solo CADA SEMANA: NO abandona los setups, los PERFECCIONA — prioriza lo que
gana, exige la condición que faltó en lo que pierde, y sube la exigencia si no fue rentable.
**Nivel de exigencia actual: 5/5.**

## ✅ Setups a PRIORIZAR (ganaron con datos reales)
- (aún sin setups ganadores con muestra suficiente — sigue recolectando)

## 🔧 Setups a AFINAR (perdieron — NO los abandones: exige la confluencia que faltó)
- (ninguno con muestra suficiente esta semana)

## 📝 Lecciones de las pérdidas de la semana
- Causa: la gestión de salida fue insuficiente; al no mover el stop a breakeven ni asegurar una parte de la posición tras alcanzar +1 R, el trade quedó expuesto a la reversión y tocó el stop.   Lección: en cualquier operación con R:R ≥ 2, tras el primer nivel de ganancia (≈+1 R) traslada el stop a breakeven o cierra parcialmente y usa trailing; además exige ADX ≥ 35 para confirmar un momentum robusto antes de entrar.
- Causa:** Entré sin la confluencia mínima requerida; faltó la confirmación de la tendencia mayor (ADX < 35 y sin nivel de liquidez claro), por lo que el timing fue desfavorable y el stop quedó demasiado estrecho.   **Lección:** Exige siempre ≥5 factores de confluencia (incluyendo ADX
- Causa:** Entré con confluencia insuficiente y timing desfavorable; el precio estaba justo en la EMA200, el ADX apenas superaba 25 y faltó una confirmación clara de impulso o captura de liquidez, por lo que el
- Causa:** Entré en el pull‑back a la EMA20 mientras el precio estaba sobrevalorado, cerca del VAH y bajo presión de venta
- Causa:** Entró sin una ruptura clara del VAL ni confirmación de captura de liquidez; el stop quedó dentro de una zona de ruido y se activó antes de que el sesgo bajista se materializara.   **Lección:** Exige siempre una ruptura o un “liquidity grab” que valide el movimiento y coloca el stop al menos 2 × ATR (fuera del rango de ruido); si falta esa confirmación, descarta la operación.
- Causa:** el stop se colocó justo encima de la EMA‑20, dentro de una zona de ruido, sin esperar una ruptura estructural o un nivel de liquidez que confirmara la caída.   **Lección:** antes de entrar, exige una confirmación clara (ruptura de EMA‑20 o bloque de liquidez) y sitúa el stop al menos 2 × ATR o fuera del rango de volatilidad para evitar ser “invalidado” por fluctuaciones menores.

**Regla para el bot:** Aplica lo aprendido de MIS resultados: prioriza los setups ganadores con más confianza; los que perdieron NO se abandonan — exígeles confluencia ≥6 y la condición que faltó según las lecciones. Confluencia mínima de 5 factores en CUALQUIER trade (nivel de exigencia 5/5). Objetivo: PERFECCIONAR los setups semana a semana para perder menos de lo evitable; ante la duda, NONE.

Relacionado: [[configuracion-optima]], [[setups-rendimiento]], [[lecciones-aprendidas]], [[confluencia]], [[meta-mensual]]

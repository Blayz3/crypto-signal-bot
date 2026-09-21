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

Generado el 2026-09-21 con los resultados REALES de la SEMANA (2026-09-14 → 2026-09-21, 12 trades, +0.5R).
El bot se entrena solo CADA SEMANA: NO abandona los setups, los PERFECCIONA — prioriza lo que
gana, exige la condición que faltó en lo que pierde, y sube la exigencia si no fue rentable.
**Nivel de exigencia actual: 5/5.**

## ✅ Setups a PRIORIZAR (ganaron con datos reales)
- EMA alignment bullish continuation: 3 trades, +1R, WR 33% → más confianza

## 🔧 Setups a AFINAR (perdieron — NO los abandones: exige la confluencia que faltó)
- (ninguno con muestra suficiente esta semana)

## 📝 Lecciones de las pérdidas de la semana
- Causa:** Entraste en el pull‑back sin confirmar que el impulso alcista estaba realmente activo (ADX estaba por debajo del umbral fuerte y el precio mostró rechazo inmediato), por lo que la señal de momentum era débil y el trade se ejecutó contra la tendencia inmediata.   **Lección:** Antes de aceptar un setup de EMA200 pull‑back, exige una confluencia A+ que incluya ADX ≥ 35 (o al menos ≥ 25 con fuerte confirmación) y una señal de impulso (p.ej., ruptura de vela o aumento del MACD); si falta, descarta la entrada.
- Causa:** Entré en el pullback de la EMA200 sin una confirmación de impulso real (ADX apenas marginal y sin ruptura del swing high),
- Causa:** El short se tomó con solo 4 factores de confluencia y un ADX apenas por encima de 25, sin confirmar la tendencia mayor ni una captura de liquidez; el stop quedó dentro del rango de ruido del VAL, por lo que el precio lo alcanzó rápidamente.   **Lección:** Antes de entrar, exige al menos 5 factores de confluencia (incluyendo ADX ≥ 35 y sesgo de timeframe superior) y sitúa el stop fuera del rango de volatilidad (≥ 2 × ATR) para evitar ser atrapado por falsos rebotes.
- Causa: la gestión del trade fue insuficiente; tras ganar +2 R no se movió el stop a break‑even ni se tomó una salida parcial, y el stop estaba justo por encima de la EMA‑200 sin margen de volatilidad, lo que permitió que la reversión borrara la ganancia.   Lección: en cualquier setup con alta confluencia, una vez que el precio alcanza +1 R lleva el stop a BE (o un trailing) y asegura al menos un parcial; además, exige confirmación de momentum (ADX ≥ 25) antes de colocar el stop tan cerca de la EMA‑200.
- Causa:** Entré en el pull‑back a la EMA‑20 cuando el impulso alcista ya estaba decayendo (ADX apenas bajo 30 y el precio justo en el VAH, zona de resistencia), por lo que la señal de continuación no estaba confirmada y el stop quedó demasiado ajustado.   **Lección:** Solo operar en pull‑backs si el ADX está ≥ 35 y el precio está por encima de la resistencia estructural; de lo contrario, espera una ruptura o una señal de impulso clara y coloca el stop al menos 2 × ATR para evitar ser sacado por ruido.
- Causa:** Falta de gestión de salida – el stop quedó en el nivel de entrada y no se aseguró ningún beneficio ni se movió a break‑even, pese a haber alcanzado +1 R antes de la reversión.   **Lección:** Tras el primer R de ganancia, traslada el stop a break‑even y/o cierra una posición parcial; usa trailing o stops dinámicos para proteger ganancias y evitar que un retroceso anule el trade.

**Regla para el bot:** Aplica lo aprendido de MIS resultados: prioriza los setups ganadores con más confianza; los que perdieron NO se abandonan — exígeles confluencia ≥6 y la condición que faltó según las lecciones. Confluencia mínima de 5 factores en CUALQUIER trade (nivel de exigencia 5/5). Objetivo: PERFECCIONAR los setups semana a semana para perder menos de lo evitable; ante la duda, NONE.

Relacionado: [[configuracion-optima]], [[setups-rendimiento]], [[lecciones-aprendidas]], [[confluencia]], [[meta-mensual]]

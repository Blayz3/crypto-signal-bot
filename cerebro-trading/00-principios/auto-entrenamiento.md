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

Generado el 2026-08-31 con los resultados REALES de la SEMANA (2026-08-24 → 2026-08-31, 9 trades, +3.4R).
El bot se entrena solo CADA SEMANA: NO abandona los setups, los PERFECCIONA — prioriza lo que
gana, exige la condición que faltó en lo que pierde, y sube la exigencia si no fue rentable.
**Nivel de exigencia actual: 5/5.**

## ✅ Setups a PRIORIZAR (ganaron con datos reales)
- (aún sin setups ganadores con muestra suficiente — sigue recolectando)

## 🔧 Setups a AFINAR (perdieron — NO los abandones: exige la confluencia que faltó)
- EMA200 pullback continuation: 5 trades, -0.6R → tómalo solo con confluencia ≥6 (perfecciona la entrada), si no NONE

## 📝 Lecciones de las pérdidas de la semana
- Causa:** la gestión de salida fue insuficiente; al no mover el stop a break‑even ni asegurar una parte de la posición cuando el precio ya había generado +1 R, la reversión borró toda la ganancia.   **Lección:** en cualquier trade con R:R ≥ 2, tras alcanzar 1 R lleva el stop a BE y toma al menos un 50 %
- Causa:** Falta de gestión activa – el trade alcanzó +3 R y no se aseguró ni se movió el stop a breakeven, dejando la posición vulnerable a la reversión.   **Lección:** Cada operación que llegue a +1 R (mínimo) debe cerrar una parte y mover el stop a BE; a partir de +2 R usa trailing o stop‑loss dinámico para proteger la ganancia y evitar que una reversión anule el beneficio.
- Causa:** La gestión del trade fue insuficiente; al alcanzar +1 R no se trasladó el stop a breakeven ni se tomó parcial, dejando la posición vulnerable a la reversión que activó el stop original.   **Lección:** En cualquier setup que cumpla con la confluencia mínima, mueve el stop a BE tan pronto como el precio supere 1 R y asegura al menos un 50 % de la posición; usa trailing o salida parcial para proteger ganancias y evitar que una reversión anule el beneficio.
- Causa: La gestión del trade fue deficiente, ya que el
- Causa:** Entró en el pull‑back sin suficiente fuerza de momentum; el ADX estaba por debajo del umbral de 35 y la confluencia total apenas alcanzó 3 factores, por lo que el setup no cumplía el filtro A+ y el precio revirtió rápidamente.   **Lección:** Solo abre cuando la confluencia sea ≥5 y el ADX ≥35 (o al menos 25 con clara tendencia mayor); si falta cualquiera de esos criterios, descarta la operación.

**Regla para el bot:** Aplica lo aprendido de MIS resultados: prioriza los setups ganadores con más confianza; los que perdieron NO se abandonan — exígeles confluencia ≥6 y la condición que faltó según las lecciones. Confluencia mínima de 5 factores en CUALQUIER trade (nivel de exigencia 5/5). Objetivo: PERFECCIONAR los setups semana a semana para perder menos de lo evitable; ante la duda, NONE.

Relacionado: [[configuracion-optima]], [[setups-rendimiento]], [[lecciones-aprendidas]], [[confluencia]], [[meta-mensual]]

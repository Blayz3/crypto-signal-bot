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

Generado el 2026-11-09 con los resultados REALES de la SEMANA (2026-11-02 → 2026-11-09, 13 trades, +3.3R).
El bot se entrena solo CADA SEMANA: NO abandona los setups, los PERFECCIONA — prioriza lo que
gana, exige la condición que faltó en lo que pierde, y sube la exigencia si no fue rentable.
**Nivel de exigencia actual: 5/5.**

## ✅ Setups a PRIORIZAR (ganaron con datos reales)
- (aún sin setups ganadores con muestra suficiente — sigue recolectando)

## 🔧 Setups a AFINAR (perdieron — NO los abandones: exige la confluencia que faltó)
- (ninguno con muestra suficiente esta semana)

## 📝 Lecciones de las pérdidas de la semana
- Causa:** la entrada se realizó justo bajo la EMA200 en una zona de ruido, sin una ruptura clara ni confirmación de momentum adicional, de modo que el stop quedó dentro del rango de fluctuación y se activó.   **Lección:** exige
- Causa: Entraste en el rebote del VAL sin confirmación de momentum (ADX < 25) ni señal de ruptura clara, por lo que el precio volvió rápidamente contra la posición y el stop estrecho se activó.   Lección: Solo abre longs en VALs cuando el ADX muestra fuerza y haya una ruptura o impulso visible (ej. vela de cierre por encima del VAL y volumen de ballenas), y coloca el stop al menos 2 × ATR para evitar salidas prematuras.
- Causa:** La entrada no cumplió el filtro A+; faltó confluencia de nivel superior (solo ADX > 30 y pullback EMA20) y el precio estaba en zona de ruido, de modo que el stop quedó dentro del rango de fluctu
- Causa:** La gestión de salida fue insuficiente; al alcanzar +1.25 R no se movió el stop a break‑even ni se tomó parcial, dejando la posición vulnerable a la reversión que activó el stop original.   **Lección:** Cada trade que supera +1 R debe tener un plan de gestión (stop a BE o parcial) y, si el ADX está solo en 25, exige una confluencia extra (p.ej. ADX ≥ 35 o confirmación de volumen) antes de entrar.
- Causa:** Falta de gestión del trade – no se aseguró la ganancia ni se movió el stop a breakeven cuando el precio alcanzó +1 R, permitiendo que la reversión borrara todo el beneficio.   **Lección:** Cada operación que llegue a +1 R debe cerrar parcialmente y/o trasladar el stop a breakeven; así se protege la ventaja y se evita que un retroceso anule la entrada.
- Causa:** Entré en un rango de ruido con ADX apenas suficiente y el stop a solo 2 × ATR sobre la EMA20, de modo que una ligera reversión activó el stop antes de que el impulso continuara.   **

**Regla para el bot:** Aplica lo aprendido de MIS resultados: prioriza los setups ganadores con más confianza; los que perdieron NO se abandonan — exígeles confluencia ≥6 y la condición que faltó según las lecciones. Confluencia mínima de 5 factores en CUALQUIER trade (nivel de exigencia 5/5). Objetivo: PERFECCIONAR los setups semana a semana para perder menos de lo evitable; ante la duda, NONE.

Relacionado: [[configuracion-optima]], [[setups-rendimiento]], [[lecciones-aprendidas]], [[confluencia]], [[meta-mensual]]

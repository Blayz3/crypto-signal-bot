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

Generado el 2026-08-03 con los resultados REALES de la SEMANA (2026-07-27 → 2026-08-03, 29 trades, -18.8R).
El bot se entrena solo CADA SEMANA: NO abandona los setups, los PERFECCIONA — prioriza lo que
gana, exige la condición que faltó en lo que pierde, y sube la exigencia si no fue rentable.
**Nivel de exigencia actual: 5/5.**

## ✅ Setups a PRIORIZAR (ganaron con datos reales)
- (aún sin setups ganadores con muestra suficiente — sigue recolectando)

## 🔧 Setups a AFINAR (perdieron — NO los abandones: exige la confluencia que faltó)
- EMAs bajistas con MACD- y en/bajo VAL: 11 trades, -9.4R → tómalo solo con confluencia ≥6 (perfecciona la entrada), si no NONE
- EMAs alcistas (long): 4 trades, -1R → tómalo solo con confluencia ≥6 (perfecciona la entrada), si no NONE
- EMAs bajistas con MACD- y bajo VAL: 3 trades, -0.7R → tómalo solo con confluencia ≥6 (perfecciona la entrada), si no NONE

## 📝 Lecciones de las pérdidas de la semana
- Causa: La falta de confluencia suficiente y un momentum débil, ya que el precio no se movió significativamente a favor después de la entrada, lo que sugiere un mal timing o una entrada contra el momentum. Lección: Exigir una confluencia más fuerte (≥6 factores) y un momentum más claro (ADX≥35) antes de tomar una posición, especialmente en trades que no tienen una tendencia clara a favor.
- Causa:** La entrada ignoró la tendencia bajista mostrada por las EMAs y la ausencia de momentum (ADX < 25), de modo que la confluencia fue insuficiente y el stop quedó en una zona de ruido.   **Lección:** Solo toma posiciones largas cuando la EMA 200 y los ADX confirmen una tendencia alcista y exige al menos 5 factores de confluencia (incluyendo tendencia y fuerza); si falta cualquiera, descarta la operación.
- Causa: La falta de confluencia suficiente de factores a favor de la tendencia y un momentum débil, reflejado en la ausencia de un ADX significativamente alto y una gestión de riesgo inadecuada.  Lección: Exigir una confluencia más fuerte, incluyendo un ADX≥25 y una mejor evaluación del momentum antes de entrar en una posición, asegurando que el riesgo esté bien manejado con un stop adecuado y un target realista.
- Causa: La falta de confluencia suficiente y una gestión de riesgo inadecuada, ya que el stop no se ajustó a medida que el precio avanzaba a favor, lo que llevó a una pérdida aunque el precio había alcanzado un máximo avance de +1.5R antes de revertir.  Lección: Exigir una confluencia más fuerte (≥6 factores) y ajustar el stop a medida que el precio avanza a favor, asegurando parcialmente las ganancias y moviendo el stop a punto de equilibrio para proteger las ganancias y maximizar el potencial de beneficio.
- Causa: La falta de confluencia suficiente y un stop demasiado ajustado en una zona de ruido, lo que no permitió que el trade se desarrollara según lo esperado.  Lección: Exigir una confluencia mínima de 5 factores y ajustar el stop considerando el ruido del mercado y el régimen de volatilidad para dar espacio al trade para que se desarrolle, evitando así stops prematuros.
- Causa: La entrada se realizó en un momento de contra-momentum, con el precio tocando el stop en un plazo breve, lo que sugiere una falta de confluencia adecuada en el contexto y el timing de la operación.  Lección: Exigir una confluencia más fuerte y un análisis más detallado del momentum y el contexto antes de realizar una entrada, especialmente cuando el precio está cerca de niveles críticos o muestra signos de debilidad en la tendencia.

**Regla para el bot:** Aplica lo aprendido de MIS resultados: prioriza los setups ganadores con más confianza; los que perdieron NO se abandonan — exígeles confluencia ≥6 y la condición que faltó según las lecciones. Confluencia mínima de 5 factores en CUALQUIER trade (nivel de exigencia 5/5). Objetivo: PERFECCIONAR los setups semana a semana para perder menos de lo evitable; ante la duda, NONE.

Relacionado: [[configuracion-optima]], [[setups-rendimiento]], [[lecciones-aprendidas]], [[confluencia]], [[meta-mensual]]

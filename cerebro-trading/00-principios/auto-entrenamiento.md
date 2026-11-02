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

Generado el 2026-11-02 con los resultados REALES de la SEMANA (2026-10-26 → 2026-11-02, 9 trades, -5R).
El bot se entrena solo CADA SEMANA: NO abandona los setups, los PERFECCIONA — prioriza lo que
gana, exige la condición que faltó en lo que pierde, y sube la exigencia si no fue rentable.
**Nivel de exigencia actual: 5/5.**

## ✅ Setups a PRIORIZAR (ganaron con datos reales)
- (aún sin setups ganadores con muestra suficiente — sigue recolectando)

## 🔧 Setups a AFINAR (perdieron — NO los abandones: exige la confluencia que faltó)
- (ninguno con muestra suficiente esta semana)

## 📝 Lecciones de las pérdidas de la semana
- Causa:** El pullback a la EMA20 se dio en una zona de ruido y el ADX apenas cumplía el umbral, de modo que la confluencia real era insuficiente (solo 4 factores) y el stop quedó demasiado cerca del precio, permitiendo que la volatilidad normal lo activara.   **Lección:** Ex
- Causa:** Entró demasiado pronto, sin una confirmación de ruptura de soporte ni un patrón de presión de venta; el ADX mostraba fuerza, pero faltó una señal de momentum (candle de rechazo, liquidity grab o ruptura clara) y el precio estaba justo en el VAL, lo que indica alta probabilidad de rebote.   **Lección:** Antes de abrir un short, exige al menos una confirmación adicional de ruptura o rechazo (candle de cierre bajo soporte, volumen y/o liquidity grab) y verifica que la confluencia total sea ≥5; si falta esa señal, descarta la operación.
- Causa:** Entré sin una confirmación clara de ruptura del VAL y con un stop demasiado estrecho (≈ 0.13 R), de modo que el precio retrocedió antes de generar momentum real.   **Lección:** Solo abre posiciones cuando el precio cierre por debajo del VAL y coloca el stop al menos 2 × ATR (o fuera de la EMA20/POC) para evitar ser sacado por ruido; exige esa confirmación y una confluencia extra antes de operar.
- Causa:** Entré en el short justo en el pull‑back a la EMA20 sin una señal clara de rechazo (candle de presión, ruptura de mínimos o liquidez atrapada); la confluencia quedó por debajo del umbral crítico (faltó al menos un factor clave como ruptura de estructura o ADX ≥ 35).   **Lección:** Antes de abrir una posición corta exige una confirmación de reversión adicional y al menos 6 factores de confluencia; si el precio está tan cerca de la EMA
- Causa:** El trade solo tenía dos factores (EMA bajo y MACD bearish) y carecía de confirmación de fuerza bajista (ADX < 25, sin ruptura ni liquidity grab), por lo que la confluencia y el contexto de tendencia eran insuficientes.   **Lección:** Exige siempre una confluencia mínima de 5‑6 factores, incluyendo ADX ≥ 25 y una señal clara de momentum antes de entrar; si la confluencia es baja, descarta la operación (NONE).
- Causa:** Entré en el breakout sin suficiente momentum – el ADX estaba por debajo del umbral óptimo y el stop quedó demasiado justo justo encima de la EMA20, lo que provocó un stop‑loss inmediato.   **Lección:** Solo tomar shorts cuando el ADX ≥ 35 y haya al menos una vela de confirmación del breakout, y colocar el stop al menos 2×ATR (o 3‑4 pips) por debajo del nivel estructural para evitar sal

**Regla para el bot:** Aplica lo aprendido de MIS resultados: prioriza los setups ganadores con más confianza; los que perdieron NO se abandonan — exígeles confluencia ≥6 y la condición que faltó según las lecciones. Confluencia mínima de 5 factores en CUALQUIER trade (nivel de exigencia 5/5). Objetivo: PERFECCIONAR los setups semana a semana para perder menos de lo evitable; ante la duda, NONE.

Relacionado: [[configuracion-optima]], [[setups-rendimiento]], [[lecciones-aprendidas]], [[confluencia]], [[meta-mensual]]

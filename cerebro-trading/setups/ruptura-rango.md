---
title: Ruptura de rango con volumen
type: setup
tags: [ruptura, breakout, rango, volumen, consolidacion]
bias: [long, short]
regime: [ranging]
timeframe: [15m, 1h, 4h]
weight: low
---

# Ruptura de rango con volumen

Tras una consolidación lateral, el precio rompe el rango y arranca un nuevo impulso.
El edge está en **entrar al inicio del movimiento**, no a mitad.

**Condiciones:**
1. **Rango claro:** mínimo 2-3 toques en soporte y resistencia, volatilidad comprimida
   (Bollinger estrechas).
2. **Ruptura con volumen:** vela que cierra fuera del rango con volumen notablemente
   superior al promedio. El volumen es lo que separa ruptura real de falsa.
3. Mejor si rompe en la dirección de la tendencia mayor (timeframe superior).

**Entrada:** al cierre de la vela de ruptura, o en el **retest** del nivel roto
(más seguro, menos falsas roturas).
**Stop:** de vuelta dentro del rango (bajo el nivel roto).
**Target:** proyección de la altura del rango desde el punto de ruptura.

**Trampa principal — fakeout:** ruptura sin volumen que regresa al rango. Por eso el
**retest** es preferible: si el nivel roto aguanta como soporte/resistencia, confirma.

**Regla para el bot:** Señala ruptura solo con volumen por encima del promedio; sin volumen, trátala como sospechosa. Prefiere entrada en el retest del nivel roto. Stop de vuelta dentro del rango.

Relacionado: [[banderas-banderines]], [[triangulos]], [[niveles-clave]], [[volumen]]

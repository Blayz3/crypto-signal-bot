---
title: Volumen como confirmación
type: estructura
tags: [volumen, confirmacion, ruptura, fuerza, liquidez]
bias: [long, short]
regime: [any]
timeframe: [any]
weight: medium
---

# Volumen como confirmación

El volumen mide la **convicción** detrás de un movimiento. Un movimiento con volumen
es creíble; sin volumen, sospechoso.

**Lecturas útiles:**
- **Ruptura con volumen alto** → válida. Ruptura con volumen flojo → probable fakeout.
- **Impulso con volumen creciente** → tendencia sana. Subida con volumen decreciente
  → posible agotamiento.
- **Climax de volumen** (pico extremo) tras un movimiento largo → posible giro/exhausto.
- En consolidaciones (banderas, triángulos) el volumen **debe caer** y repuntar en la ruptura.

**Cómo lo aplica el bot:** comparar el volumen de la vela clave (ruptura, rechazo)
contra el promedio reciente. Por encima del promedio confirma; muy por debajo, resta
confianza.

**Regla para el bot:** Exige volumen por encima del promedio para validar rupturas e impulsos. Sin volumen, baja la confianza de la señal. Volumen decreciente en un impulso = posible agotamiento.

Relacionado: [[ruptura-rango]], [[banderas-banderines]], [[triangulos]]

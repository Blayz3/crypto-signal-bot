---
title: Triángulos
type: patron-chart
tags: [triangulo, compresion, ruptura, continuacion]
bias: [long, short]
regime: [ranging, trending]
timeframe: [1h, 4h, 1d]
weight: low
---

# Triángulos

Compresión de precio entre dos líneas convergentes; el volumen baja hasta la ruptura.

- **Ascendente:** resistencia plana + mínimos crecientes. Sesgo **alcista** (compradores
  presionando un techo).
- **Descendente:** soporte plano + máximos decrecientes. Sesgo **bajista**.
- **Simétrico:** ambas convergen; **neutral**, se opera la dirección de la ruptura.

**Entrada:** ruptura confirmada de una de las líneas (mejor con retest y volumen).
**Stop:** dentro del triángulo, al otro lado de la línea rota.
**Target:** altura de la base del triángulo proyectada desde la ruptura.

**Cuidado:** los triángulos generan muchas **roturas falsas** cerca del vértice. Operar
roturas tempranas (no en la punta) y con volumen. Si no hay volumen, esperar el retest.

**Regla para el bot:** En triángulo, espera ruptura con volumen (o retest) antes de señalar. Ascendente=sesgo long, descendente=sesgo short, simétrico=neutral hasta romper. Desconfía de roturas en el vértice.

Relacionado: [[ruptura-rango]], [[volumen]], [[niveles-clave]]

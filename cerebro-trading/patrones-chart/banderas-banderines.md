---
title: Banderas y banderines
type: patron-chart
tags: [bandera, banderin, continuacion, impulso, consolidacion]
bias: [long, short]
regime: [trending]
timeframe: [15m, 1h, 4h]
weight: medium
---

# Banderas y banderines

Patrones de **continuación**: tras un impulso fuerte (el "mástil"), el precio
consolida en un canal pequeño contra-tendencia (bandera) o un triángulo apretado
(banderín), y luego retoma la dirección del impulso.

**Características:**
- **Mástil:** movimiento direccional fuerte y rápido.
- **Bandera:** consolidación ligeramente en contra, en canal estrecho, con volumen
  decreciente.
- **Ruptura** en la dirección del mástil → continuación.

**Entrada:** ruptura del límite de la bandera a favor del impulso, idealmente con
repunte de volumen.
**Stop:** al otro lado de la bandera.
**Target:** proyectar la altura del mástil desde el punto de ruptura.

**Clave:** es patrón **a favor de tendencia**. El volumen debe caer durante la bandera
y repuntar en la ruptura. Si el volumen no acompaña, sospechar.

**Regla para el bot:** Reconoce banderas/banderines como continuación tras un impulso; opera la ruptura a favor del impulso con volumen. Target = altura del mástil. No lo operes contra la tendencia.

Relacionado: [[ruptura-rango]], [[volumen]], [[pullback-tendencia]]

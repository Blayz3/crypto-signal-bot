---
title: Escalado y piramidar
type: estructura
tags: [escalado, piramidar, scaling, entradas-parciales, gestion]
bias: [long, short]
regime: [trending]
timeframe: [any]
weight: medium
---

# Escalado y piramidar

Entrar o salir **por partes** en vez de todo de golpe, para mejorar el precio medio y
gestionar el riesgo.

**Escalar la ENTRADA (scaling in):**
- Divide la entrada en 2-3 órdenes limit en distintos niveles de la zona (ej. inicio, 50%
  y extremo del order block). Mejora el precio medio si la zona es amplia.
- Útil cuando no sabes el punto exacto de giro pero confías en la zona.

**Piramidar (añadir a ganadores):**
- Sumar tamaño SOLO cuando el trade ya va a favor y hace un nuevo BOS/retest.
- **Mueve el stop** de toda la posición para que el riesgo total no aumente.
- Nunca piramides un perdedor (eso es promediar a la baja = peligroso).

**Escalar la SALIDA (scaling out):**
- Toma parciales en objetivos intermedios y deja correr el resto ([[gestion-posicion]]).

**Regla para el bot:** Puedes plantear entradas escalonadas (varias limit en la zona) para mejor precio medio, y sugerir piramidar solo añadiendo a ganadores con el stop reajustado. Nunca promediar a la baja un perdedor.

Relacionado: [[gestion-posicion]], [[order-blocks]], [[tipos-de-orden]], [[tamano-posicion]]

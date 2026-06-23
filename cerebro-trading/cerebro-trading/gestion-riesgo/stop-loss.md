---
title: Stop-loss
type: riesgo
tags: [riesgo, stop, atr, estructura, invalidacion]
bias: [long, short]
regime: [any]
timeframe: [any]
weight: high
---

# Stop-loss

El stop define **dónde la idea está equivocada**, no un número arbitrario. Si el
precio lo alcanza, el setup se invalidó: se sale, punto.

**Dónde colocarlo:**
- **Por estructura:** debajo del último mínimo relevante (long) o sobre el último
  máximo (short). Es el stop más lógico porque romperlo cambia la estructura.
- **Por ATR:** entrada ∓ ~**2 × ATR** (el backtest out-of-sample mostró que 2×ATR generaliza
  mejor que 1.5×: da aire al ruido y sube el WR sin perder estructura). Útil cuando no hay
  estructura clara cerca.
- Usa el **más conservador y lógico** de los dos, no el más cercano por avaricia.

**Reglas de oro:**
- El stop se pone **al abrir**, nunca después.
- **Nunca alejes el stop** para "darle más espacio" a un trade perdedor. Eso es
  cómo una pérdida pequeña se vuelve catastrófica.
- Sí puedes **acercarlo a favor** (trailing) para proteger ganancia.
- Un stop demasiado ajustado te saca con ruido; demasiado lejano arruina el R:R.

**Regla para el bot:** Coloca el stop en la invalidación estructural (último mínimo/máximo) o a 1.5×ATR, lo que sea más lógico. El stop es obligatorio en toda señal. Nunca propongas mover el stop en contra.

Relacionado: [[tamano-posicion]], [[rr-minimo]], [[niveles-clave]]

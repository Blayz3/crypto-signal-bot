---
title: Volume Profile (POC, HVN, LVN) y cómo analizarlo
type: setup
tags: [volume-profile, poc, hvn, lvn, value-area, volumen, nodos]
bias: [long, short]
regime: [trending, ranging]
timeframe: [1h, 4h, 1d]
weight: high
---

# Volume Profile (POC, HVN, LVN) y cómo analizarlo

El **Volume Profile** muestra CUÁNTO volumen se negoció en CADA precio (histograma horizontal),
no en el tiempo. Revela dónde el mercado "aceptó" precio (mucho volumen) y dónde lo "rechazó"
(poco volumen). Es de los análisis más potentes para ubicar soportes/resistencias reales.

## Conceptos clave
- **POC (Point of Control):** el precio con MÁS volumen del perfil (la barra más larga/roja).
  Es un **imán** y un soporte/resistencia fuerte. El precio tiende a volver a él.
- **HVN (High Volume Node):** zonas de mucho volumen (las bandas anchas). El precio **se frena
  y reacciona** ahí (acepta valor). Actúan como S/R y como zonas de consolidación.
- **LVN (Low Volume Node):** zonas de poco volumen (huecos en el histograma). El precio
  **las atraviesa rápido** (rechazó ese valor). Buenas para targets y para detectar rupturas
  limpias; entre dos HVN hay un LVN por el que el precio "viaja".
- **Value Area (VA):** rango donde ocurrió ~70% del volumen, entre **VAH** (alto) y **VAL** (bajo).
  Dentro del VA = equilibrio (rango); fuera = desbalance (tendencia).
- **POC virgen / naked POC:** un POC de un periodo previo que el precio aún no ha vuelto a tocar.
  Es un imán potente: el precio suele ir a buscarlo.

## Cómo hacer el análisis (paso a paso)
1. **Dibuja el perfil** del tramo/rango relevante (la consolidación previa). Identifica POC, VAH, VAL.
2. **Ubica el precio respecto al perfil:** ¿dentro del VA (rango), sobre el VAH o bajo el VAL
   (desbalance)?
3. **Proyecta los niveles hacia adelante:** el POC y los bordes del VA siguen siendo S/R cuando
   el precio regresa a ellos (como las líneas rojas extendidas del gráfico).
4. **Lee la reacción en el nivel:** cuando el precio vuelve a un HVN/POC desde fuera, espera
   **reacción** (rechazo si lo respeta, o ruptura+aceptación si lo traspasa con volumen).

## Setups con Volume Profile
- **Rechazo en HVN/POC (el del gráfico):** el precio sube/baja hacia un nodo de alto volumen
  previo (resistencia), y **rechaza** → fade hacia el lado opuesto. Entrada limit en el nodo,
  stop al otro lado del HVN, target el siguiente HVN/POC o el LVN.
- **Viaje por LVN:** una ruptura que entra en una zona de bajo volumen se mueve rápido hasta el
  siguiente HVN → buen tramo para dejar correr.
- **Vuelta al POC:** si el precio se aleja del POC, suele volver a testearlo (reversión a la media).
- **Confluencia:** POC/VA + order block + nivel estructural + Fibonacci = zona A+ ([[confluencia]]).

## El bot recibe POC/VAH/VAL calculados
En los datos de mercado, el bot recibe el **POC, VAH y VAL** reales del símbolo. Úsalos como
niveles clave: precio cerca del POC = imán/reacción; fuera del VA = desbalance/tendencia.

**Regla para el bot:** Usa POC, VAH y VAL como soportes/resistencias de alta calidad. Precio que regresa a un HVN/POC desde fuera = espera reacción (rechazo para fade, o ruptura con volumen para continuación). LVN = el precio viaja rápido (úsalo como target). Dentro del VA = rango; fuera = desbalance/tendencia. Combina con estructura y order blocks.

Relacionado: [[market-profile]], [[volumen]], [[order-blocks]], [[niveles-clave]], [[liquidez]], [[rechazo-soporte-resistencia]]

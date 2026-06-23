---
title: Bias direccional (sesgo)
type: estructura
tags: [bias, sesgo, direccion, htf, tendencia, contexto]
bias: [long, short]
regime: [any]
timeframe: [any]
weight: high
---

# Bias direccional (sesgo)

El bias es **hacia dónde esperas que vaya el precio** según el contexto mayor. Define qué
lado operar; sin bias claro, operas a ciegas.

**Cómo establecerlo (de mayor a menor peso):**
1. **Estructura del timeframe alto (4h/1d):** ¿HH/HL (alcista) o LH/LL (bajista)? Ese es el
   bias base ([[estructura-de-mercado]]).
2. **Posición en el rango / premium-discount:** en bias alcista busca compras en *discount*
   (mitad inferior); en bajista, ventas en *premium* ([[premium-discount]]).
3. **Liquidez objetivo:** ¿qué lado tiene liquidez sin tomar (máximos/mínimos iguales)? El
   precio suele ir a buscarla ([[liquidez]]).
4. **Contexto macro:** BTC, sentimiento, funding, ballenas ([[00-como-leer-datos]]).

**Reglas:**
- **Opera a favor del bias del HTF.** Contra-bias solo con CHoCH confirmado.
- El bias puede ser **neutral** (rango / conflicto) → reduce tamaño o espera.
- El bias **no es una predicción fija**: si la estructura cambia (CHoCH), tu bias cambia.
  Mantén criterio propio ([[criterio-propio]]).

**Regla para el bot:** Establece el bias desde la estructura del timeframe alto + premium/discount + liquidez objetivo. Opera a favor de ese bias; ve contra él solo con CHoCH confirmado. Bias neutral = sé conservador.

Relacionado: [[estructura-de-mercado]], [[multi-timeframe]], [[premium-discount]], [[liquidez]], [[criterio-propio]]

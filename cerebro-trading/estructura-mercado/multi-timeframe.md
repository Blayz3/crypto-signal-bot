---
title: Análisis multi-timeframe (top-down)
type: estructura
tags: [multi-timeframe, htf, ltf, top-down, contexto, alineacion]
bias: [long, short]
regime: [any]
timeframe: [any]
weight: high
---

# Análisis multi-timeframe (top-down)

Mirar varias temporalidades evita operar contra la corriente mayor. Se analiza de
**arriba hacia abajo**: el timeframe alto da el contexto, el bajo da la entrada.

**Jerarquía:**
- **Timeframe alto (4h/1d):** define la tendencia y los niveles clave (el "clima"). Marca
  el sesgo direccional permitido.
- **Timeframe medio (1h):** define la estructura y el setup (rango, zona, MSB).
- **Timeframe bajo (15m/5m):** afina la entrada y el stop ajustado.

**Regla de oro — alineación:** opera la entrada del timeframe bajo **a favor** del sesgo del
alto. Un long en 15m dentro de una tendencia bajista de 4h es de baja probabilidad (salvo
reversión confirmada con MSB en el alto). La confluencia entre temporalidades = alta probabilidad.

**Conflictos:** si el alto es alcista y el bajo da señal short, suele ser solo un retroceso
(oportunidad de long en la corrección), no un short de tendencia.

**Regla para el bot:** Respeta la jerarquía: el timeframe mayor manda el sesgo, el menor da la entrada. Prioriza setups alineados entre temporalidades; desconfía de entradas que contradicen el timeframe alto salvo reversión confirmada.

Relacionado: [[tendencia-vs-rango]], [[00-rektproof-metodologia]], [[criterio-propio]], [[niveles-clave]]

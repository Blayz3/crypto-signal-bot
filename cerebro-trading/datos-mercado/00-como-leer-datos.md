---
title: Cómo leer los datos de mercado en vivo
type: principio
tags: [datos, edge, funding, ballenas, sentimiento, noticias, contexto]
bias: [long, short]
regime: [any]
timeframe: [any]
weight: high
---

# Cómo leer los datos de mercado en vivo

En cada decisión recibes un bloque "DATOS DE MERCADO EN VIVO". Úsalo como **filtro de
contexto y confirmación**, nunca como señal única. Reglas rápidas:

- **Fear & Greed:** extremos son contrarian. **Miedo extremo (<20)** = posible suelo,
  favorece buscar LONG con confirmación. **Codicia extrema (>80)** = posible techo,
  favorece SHORT. En zona neutral, no influye.
- **Funding rate:** muy **positivo** = longs sobre-apalancados → riesgo de long squeeze
  (cuidado con LONG tardío). Muy **negativo** = shorts sobre-apalancados → riesgo de short
  squeeze (cuidado con SHORT tardío). Cerca de 0 = equilibrado.
- **Flujo de ballenas (compras vs ventas):** desbalance fuerte hacia compras apoya LONG;
  hacia ventas apoya SHORT. Si el flujo contradice tu sesgo técnico, baja la confianza.
- **Dominancia BTC y mcap global:** si el mercado global cae y BTC drena a las alts,
  evita LONG en alts ([[correlacion-btc]]).
- **Noticias:** si hay un catalizador de alto impacto reciente o inminente, reduce
  confianza o espera ([[evitar-noticias]], [[noticias-catalizadores]]).

**Confluencia ideal:** técnica + datos alineados. Ej. RektProof LONG en demanda + Miedo
Extremo + funding negativo + ballenas comprando = señal de alta convicción.

**Regla para el bot:** Integra los DATOS DE MERCADO como filtro: si contradicen el setup técnico, baja la confianza o devuelve none. Si lo confirman (sentimiento contrarian + funding + flujo de ballenas a favor), súbele convicción. Nunca operes solo por un dato aislado.

Relacionado: [[flujo-ballenas]], [[funding-open-interest]], [[fear-greed]], [[liquidaciones]], [[noticias-catalizadores]], [[correlacion-btc]]

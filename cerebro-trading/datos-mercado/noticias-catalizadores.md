---
title: Noticias y catalizadores
type: estructura
tags: [noticias, catalizadores, fundamental, eventos, sentimiento]
bias: [long, short]
regime: [any]
timeframe: [any]
weight: medium
---

# Noticias y catalizadores

Las noticias mueven el precio de golpe y pueden invalidar el análisis técnico. El bot
recibe titulares recientes (RSS o CryptoPanic con sentimiento). Úsalos como **filtro**.

**Cómo usarlas:**
- **Catalizador alcista fresco** (aprobación regulatoria, adopción, ETF, ganancias) →
  apoya LONG si coincide con la técnica.
- **Catalizador bajista** (hackeo, prohibición, deslistado, problema de un exchange) →
  apoya SHORT o evitar LONG.
- **Evento de alto impacto inminente o muy reciente** (CPI, FOMC, decisión de la Fed) →
  **mejor esperar**: la volatilidad barre stops en ambos sentidos ([[evitar-noticias]]).
- Si el sentimiento de las noticias contradice tu sesgo técnico, **reduce la confianza**.

**Cuidado con operar la noticia ya publicada:** "buy the rumor, sell the news". Muchas veces
el movimiento ya ocurrió antes del titular. No persigas.

**Regla para el bot:** Usa los titulares como filtro de contexto: un catalizador a favor sube convicción; uno en contra o un evento macro inminente baja la confianza o devuelve none. No persigas una noticia ya publicada.

Relacionado: [[00-como-leer-datos]], [[evitar-noticias]], [[fear-greed]]

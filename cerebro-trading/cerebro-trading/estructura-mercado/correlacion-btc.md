---
title: Correlación con BTC
type: estructura
tags: [btc, correlacion, altcoins, contexto, dominancia, macro]
bias: [long, short]
regime: [any]
timeframe: [any]
weight: high
---

# Correlación con BTC

En crypto, **BTC manda**. La mayoría de las altcoins están altamente correlacionadas:
cuando BTC cae fuerte, casi todo cae (y peor, porque las alts son más volátiles).

**Reglas prácticas:**
- **No abrir longs en alts si BTC está rompiendo a la baja** o en caída fuerte, por más
  bonito que se vea el gráfico de la alt. La correlación gana.
- **No abrir shorts en alts si BTC está bombeando** con fuerza.
- Las alts dan sus mejores movimientos cuando **BTC está estable o en tendencia** a
  favor de la dirección del trade.
- Vigila la **dominancia de BTC**: si sube, suele drenar a las alts aunque BTC suba.

**Filtro de contexto:** antes de cualquier señal en una alt, revisar el estado de BTC
en timeframe mayor (4h/1d). BTC es el "clima" sobre el que opera todo lo demás.

**Regla para el bot:** Antes de un long en una altcoin, verifica que BTC no esté en caída fuerte (4h/1d); antes de un short, que BTC no esté subiendo con fuerza. Si BTC contradice el trade, baja la confianza o devuelve none.

Relacionado: [[tendencia-vs-rango]], [[evitar-noticias]], [[proceso-sobre-resultado]]

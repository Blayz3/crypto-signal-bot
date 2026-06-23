---
title: NY Open — análisis de aperturas (auto-actualizado)
type: principio
tags: [ny-open, apertura, nueva-york, reversion, sesion, btc]
bias: [long, short]
regime: [any]
timeframe: [1h]
weight: high
---

# NY Open — análisis de aperturas (auto-actualizado)

Análisis del 2026-06-23 12:12 sobre 269 aperturas de las **8 AM hora de Nueva York** de BTC/USDT
(últimos 270 días). Hipótesis: si abre bajando, tarde o temprano sube; si abre subiendo,
tarde o temprano baja (reversión de la apertura dentro de la sesión).

## Resultados
| Apertura | Muestra | % que revierte | Fade WR (2R) | Expectativa fade |
|---|---|---|---|---|
| **Abre SUBIENDO** | 135 | 86% | 38% | 0.016R |
| **Abre BAJANDO** | 134 | 81% | 37% | -0.007R |
| **Global** | 269 | 84% | 37% | 0.005R |

**Veredicto:** La hipótesis se sostiene: la mayoría de aperturas revierten.

> ⚠️ **Matiz crítico:** aunque el 84% de las aperturas revierten, hacer
> "fade" a ciegas con stop fijo PIERDE (WR 37%, expectativa 0.005R).
> Motivo: el impulso de apertura puede correr primero y tocar tu stop ANTES de revertir.
> Conclusión: la reversión es un **sesgo de contexto muy fiable**, pero NO un gatillo
> automático. Úsalo para saber qué dirección vigilar, y entra solo con confirmación.

## Cómo operar la apertura de NY
- A las **8 AM NY** observa la dirección de la apertura de BTC (primera vela de la sesión).
- Si abre **subiendo**, prepárate para un posible **techo y reversión a la baja** dentro de la
  sesión (busca SHORT en exhaustión/resistencia). Si abre **bajando**, prepárate para un
  posible **suelo y reversión al alza** (busca LONG en soporte).
- **Espera confirmación** (rechazo, MSB, divergencia): la reversión llega "tarde o temprano",
  no necesariamente en la primera vela. No te adelantes ([[liquidez]], [[msb-quiebre-estructura]]).
- BTC marca el ritmo de las alts ([[correlacion-btc]]): el sesgo de la apertura de BTC aplica
  al resto del mercado.

**Regla para el bot:** En la sesión de NY, usa la dirección de la apertura de BTC (8 AM NY) como sesgo CONTRARIAN para la sesión: apertura alcista → vigila reversión bajista; apertura bajista → vigila reversión alcista. Es un sesgo probabilístico (84% revierten), no una certeza: exige confirmación técnica antes de entrar.

Relacionado: [[sesiones-killzones]], [[correlacion-btc]], [[liquidez]], [[criterio-propio]], [[confluencia]]

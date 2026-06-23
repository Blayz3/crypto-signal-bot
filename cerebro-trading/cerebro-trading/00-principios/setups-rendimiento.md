---
title: Rendimiento de los setups (auto-backtest)
type: principio
tags: [setups, rendimiento, backtest, ranking, expectativa]
bias: [long, short]
regime: [any]
timeframe: [1h]
weight: high
---

# Rendimiento de los setups (auto-backtest)

Backtest mecánico del 2026-06-23: ~90 días, 20 monedas, 1h, stop 2×ATR, target 2R.
Mide cómo rinde cada setup del cerebro con datos reales. Ordenado por expectativa (profit).

| Setup | Trades | WR | Expectativa | PF |
|---|---|---|---|---|
| momentum-macd | 533 | 42% | 0.161R | 1.28 |
| pullback-ema | 680 | 37% | 0.035R | 1.06 |
| retest | 1025 | 37% | 0.033R | 1.06 |
| ruptura | 998 | 37% | 0.023R | 1.04 |
| rechazo-sr | 949 | 35% | -0.049R | 0.92 |
| rsi-reversion | 741 | 33% | -0.119R | 0.82 |

**Setups que GANAN (priorízalos):** momentum-macd, pullback-ema, retest, ruptura.
**Setups DÉBILES (exige confluencia extra o evítalos):** rechazo-sr, rsi-reversion.

**Regla para el bot:** Prioriza los setups con mejor expectativa de esta tabla y trátalos con más confianza. Con los setups débiles (expectativa ≤ 0), exige confluencia extra (contexto + nivel + datos de mercado) o devuelve none. Los números son del motor mecánico; tu criterio y la confluencia los mejoran.

Relacionado: [[configuracion-optima]], [[confluencia]], [[expectativa-y-winrate]], [[analizar-errores]]

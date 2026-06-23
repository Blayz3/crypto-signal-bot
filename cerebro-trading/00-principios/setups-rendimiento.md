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

Backtest mecánico del 2026-06-13: ~90 días, 20 monedas, 1h, stop 2×ATR, target 2R.
Mide cómo rinde cada setup del cerebro con datos reales. Ordenado por expectativa (profit).

| Setup | Trades | WR | Expectativa | PF |
|---|---|---|---|---|
| momentum-macd | 594 | 40% | 0.102R | 1.18 |
| rechazo-sr | 1014 | 38% | 0.017R | 1.03 |
| pullback-ema | 765 | 36% | 0.006R | 1.01 |
| retest | 1064 | 35% | -0.024R | 0.96 |
| ruptura | 1056 | 35% | -0.034R | 0.95 |
| rsi-reversion | 765 | 36% | -0.043R | 0.93 |

**Setups que GANAN (priorízalos):** momentum-macd, rechazo-sr, pullback-ema.
**Setups DÉBILES (exige confluencia extra o evítalos):** retest, ruptura, rsi-reversion.

**Regla para el bot:** Prioriza los setups con mejor expectativa de esta tabla y trátalos con más confianza. Con los setups débiles (expectativa ≤ 0), exige confluencia extra (contexto + nivel + datos de mercado) o devuelve none. Los números son del motor mecánico; tu criterio y la confluencia los mejoran.

Relacionado: [[configuracion-optima]], [[confluencia]], [[expectativa-y-winrate]], [[analizar-errores]]

---
title: Meta mensual — 130R con PF > WR%
type: principio
tags: [meta, objetivo, mensual, 130r, profit-factor, win-rate, disciplina]
bias: [long, short]
regime: [any]
timeframe: [any]
weight: high
---

# Meta mensual — 130R con PF > WR%

**Objetivo: +130R por mes con Profit Factor MAYOR que el Win Rate (como porcentaje).**

Ejemplo: WR 45% implica PF > 4.5. WR 55% implica PF > 5.5. Esta regla garantiza
que los ganadores compensan a los perdedores tanto en frecuencia como en magnitud.

## La matemática de 130R

| Escenario | WR | RR medio | Exp/trade | Trades necesarios |
|-----------|-----|----------|-----------|-------------------|
| Conservador | 45% | 2.5R | +0.675R | ~193 trades |
| Objetivo | 50% | 2.8R | +0.90R | ~145 trades |
| Ideal | 55% | 3.0R | +1.05R | ~124 trades |

El camino: 6-7 trades A+ al dia, no 20 trades mediocres.

## PF > WR% — el principio clave

- Profit Factor = Ganancia bruta / Perdida bruta
- WR% = (Wins / Total) x 100
- REGLA: PF > WR%

Valido: PF 3.2 con WR 28%, PF 4.8 con WR 45%
Invalido: PF 2.0 con WR 55%, PF 1.5 con WR 40%

## Como lograr PF > WR%

1. RR minimo 2.2:1 siempre
2. BE a +1R obligatorio — convierte perdidas en 0R, sube PF
3. Parcial en 2R, trailing el resto a 3-6R
4. Solo senales con 2/2 core LLMs (Nemotron + Claude)
5. Score tecnico >= 78 (majors BTC/ETH/XRP/SOL >= 88)
6. 7 candidatos LLM por scan, semaforo anti-rate-limit

## Ritmo diario

- Meta diaria: ~6.5R (130R / 20 dias)
- Max trades/dia: 8
- Freno perdida diaria: -4R parar
- Senal con conf < 78% o RR < 2.2: ignorar

## Regla para el bot

Meta: +130R/mes con PF > WR%. Solo senales A+ con doble confirmacion LLM,
score >= 78 (majors >= 88), RR >= 2.2. BE a +1R. Runners a 3-6R. Sin A+: skip.

---
title: Backtest — aprendizajes por par (15m, 500 velas)
type: principio
tags: [backtest, pares, errores, aprendizaje, majors, alts, 15m]
bias: [long, short]
regime: [any]
timeframe: [15m]
weight: high
---

# Backtest: Por que ganan y por que pierden (15m)

Backtest corrido: 218 trades, 12 pares, 500 velas de 15m. Sin filtro LLM (solo tecnico).

## Pares GANADORES (PF > 2.0)

| Par | WR | PF | Exp | Por que gana |
|-----|----|----|-----|--------------|
| BEAT | 55.6% | 2.50 | +0.67R | Trending alt, momentum limpio, menos participantes institucionales |
| ESPORTS | 55.0% | 2.44 | +0.65R | Baja eficiencia, impulsos sostenidos, menos HFT noise |
| VELVET | 52.6% | 2.22 | +0.58R | Estructura tecnica mas respetada, menos manipulacion |

**Patron comun en ganadores**: alts pequeños con capitalizacion < $500M, momentum
unidireccional, menos HFTs y market makers agresivos, estructuras tecnicas mas limpias.

## Pares PERDEDORES (PF < 1.0)

| Par | WR | PF | Exp | Por que pierde |
|-----|----|----|-----|----------------|
| BTC | 18.2% | 0.44 | -0.46R | Mercado hiperefficiente, 15m = puro ruido para el sistema actual |
| ETH | 19.0% | 0.47 | -0.43R | Igual que BTC, correlacionado y con el mismo ruido |
| XRP | 17.6% | 0.43 | -0.47R | Manipulacion de precio frecuente, stops barridos sistematicamente |
| WLD | 18.8% | 0.46 | -0.44R | Baja liquidez real a pesar de volumen, spreads ocultos |
| ZEC | 22.2% | 0.57 | -0.33R | Movimientos erraticos, sin tendencia sostenida |
| HYPE | 30.0% | 0.86 | -0.10R | Nuevo token, comportamiento no sistematizable |
| DOGE | 31.6% | 0.92 | -0.05R | Driven por sentiment/social, no por tecnico |

## Diagnostico: Por que fallan los majors en 15m

1. **Alta eficiencia**: BTC/ETH tienen millones de participantes. Cualquier patron
   tecnico simple ya esta arbitrado. El sistema necesita edge adicional.

2. **Stops barridos antes del move**: el precio hace un sweep del SL y luego va
   en la direccion prevista. En 15m el ATR es demasiado estrecho para sobrevivir.

3. **Institucionales mueven el precio**: los grandes actores acumulan/distribuyen en
   rangos que parecen senales tecnicas pero son trampa.

4. **Correlacion entre majors**: BTC cae, ETH cae, XRP cae. Si el scan pone 3 majors
   como candidatos, es un solo trade con 3x el riesgo.

## Reglas derivadas para el bot

### Para majors (BTC, ETH, XRP, SOL, BNB):
- Score tecnico minimo: **88/100** (no 78)
- RSI debe estar en zona extrema: < 30 o > 70
- Volumen debe ser 2x sobre la media de 20 velas
- EMA 20/50/200 alineadas en la misma direccion
- Preferir orden LIMIT (esperar pullback al nivel, no entrar en ruptura)
- Si no cumple TODO: skip obligatorio

### Para alts medianos (caps $100M-$2B):
- Score minimo: 78/100
- RSI entre 45-75 (long) o 25-55 (short)
- Continuacion de tendencia sobre reversal
- Market o limit segun momentum

### Para tokens erraticos (DOGE, HYPE, meme coins):
- Solo si score > 90 Y hay catalizador de volumen claro
- Preferir skip — el tecnico no predice el sentiment

## Meta y contexto

Meta: 130R/mes con PF > WR%. Este backtest (sin LLM) da 33.9% WR global.
Con doble confirmacion LLM (Nemotron + Claude) el WR real deberia subir a 50-60%
porque el LLM filtra setups tecnicos que no tienen contexto de mercado favorable.

El cerebro se actualiza cada scan con nuevos aprendizajes via el modulo llm_cerebro.py.

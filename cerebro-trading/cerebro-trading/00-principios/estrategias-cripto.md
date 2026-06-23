---
title: Estrategias cripto — manual completo para el bot
type: principio
tags: [estrategias, momentum, breakout, wyckoff, ballenas, volumen, noticias, funding]
bias: [long, short]
regime: [any]
timeframe: [15m, 1h, 4h]
weight: high
---

# Estrategias Cripto — Manual para los LLMs

Los modelos LLM deben evaluar TODOS los factores antes de emitir una senal.
Una senal A+ requiere confluencia de al menos 3-4 de estos elementos.

---

## 1. MOMENTUM TRENDING (mas alta WR en alts: 52-55%)

**Cuando usar**: mercado en tendencia clara, precio sobre EMA200, pullbacks a EMA20/50.

Setup LONG:
- Precio > EMA20 > EMA50 > EMA200 (alineacion perfecta)
- RSI entre 50-70 (momentum sin sobrecompra)
- MACD histograma positivo y creciendo
- Volumen en las velas alcistas 1.5x sobre la media
- Entrada en pullback a EMA20 o nivel de soporte previo

Setup SHORT:
- Precio < EMA20 < EMA50 < EMA200
- RSI entre 30-50
- MACD negativo
- Entrada en rebote hacia EMA20 como resistencia

**Tipo de orden**: LIMIT (esperar el pullback al nivel, no perseguir)
**RR objetivo**: 2.5-3.5R
**Stop**: bajo el swing low del pullback (long) o sobre el swing high (short)

---

## 2. BREAKOUT DE ESTRUCTURA (alta recompensa, menor WR 40-45%)

**Cuando usar**: precio comprimido en rango, volumen acumulando, ruptura inminente.

Condiciones de validacion:
- Precio en rango estrecho por 10+ velas
- Volumen decreciente durante la compresion (spring de Wyckoff)
- Ruptura con vela de cuerpo > 70% del ATR
- Volumen en la ruptura 2x+ sobre la media de 20 periodos
- Retest del nivel roto como nuevo soporte/resistencia

**Tipo de orden**: MARKET (no esperar, la oportunidad se va)
**RR objetivo**: 3-5R (los breakouts buenos corren lejos)
**Stop**: bajo el rango para longs, sobre el rango para shorts
**Cuidado con**: fakeouts. Si el volumen en la ruptura es bajo = trampa.

---

## 3. WYCKOFF — ACUMULACION Y DISTRIBUCION

Fase de acumulacion (precede rally):
- Selling climax: vela de caida brutal con volumen extremo (ballenas comprando)
- Automatic rally: rebote fuerte
- Secondary test: regresa al soporte con menos volumen (confirmacion)
- Spring: baja brevemente bajo el soporte (trampa de bajistas, last shakeout)
- Entrada en el spring con stop bajo el minimo

Fase de distribucion (precede caida):
- Buying climax: vela de subida fuerte con volumen extremo (ballenas vendiendo)
- Automatic reaction: caida
- Secondary test: regresa a resistencia con menos volumen
- UTAD: sube brevemente sobre resistencia (trampa de alcistas)
- Entrada en el UTAD con stop sobre el maximo

**Tipo de orden**: LIMIT en el spring/UTAD
**RR objetivo**: 4-8R (setups de alta conviccion)

---

## 4. MOVIMIENTOS DE BALLENAS (whale detection)

Indicadores de actividad de ballenas:
- **Volumen anormal**: vela con 5x+ el volumen promedio de 50 periodos = acumulacion/distribucion institucional
- **Funding rate extremo**: si funding > +0.1% (longs pagando mucho) = squeeze bajista inminente. Si < -0.1% = squeeze alcista.
- **Open interest + precio**: OI sube + precio sube = tendencia saludable. OI sube + precio baja = distribucion.
- **Liquidaciones en cascada**: despues de una liquidacion masiva, el precio suele rebotar violentamente.

Reglas para el bot:
- Si el ultimo volumen es 3x+ la media: ESPERAR confirmacion de direccion antes de entrar
- Si hay vela de mecha larga (wick > 2x el cuerpo): ballena barriendo stops, oportunidad en la direccion contraria al wick
- Funding rate positivo extremo + RSI sobrecomprado + resistencia: senal SHORT de alta conviccion

---

## 5. VOLUMEN — el factor mas ignorado

El volumen confirma o invalida cualquier senal tecnica:

| Precio sube + Volumen sube | Tendencia alcista saludable — LONG valido |
| Precio sube + Volumen baja | Trampa alcista — no entrar long |
| Precio baja + Volumen sube | Tendencia bajista fuerte — SHORT valido |
| Precio baja + Volumen baja | Pullback en tendencia alcista — LONG en el soporte |

**Volume profile**: el precio tiende a volver a las zonas de alto volumen (Point of Control).
Si el precio esta lejos del POC, hay probabilidad de retorno.

**Regla critica**: NUNCA entrar en una senal sin confirmar el volumen.
Una ruptura sin volumen = fakeout con 80% de probabilidad.

---

## 6. TENDENCIAS MACRO Y CONTEXTO DE MERCADO

Antes de entrar en cualquier trade:

**Dominancia BTC**: si BTC.D sube, el dinero sale de alts. Evitar longs en alts.
Si BTC.D baja, el dinero fluye a alts. Favorecer longs en alts.

**Correlacion BTC**: si BTC esta cayendo fuerte, evitar longs en cualquier par.
Si BTC consolida en soporte fuerte, es seguro buscar longs en alts fuertes.

**Regimen de mercado**:
- Mercado alcista (BTC sobre EMA200 semanal): favorecer longs, shorts solo en extremos
- Mercado bajista (BTC bajo EMA200 semanal): favorecer shorts, longs solo en sobrementos
- Mercado lateral: reducir size, favorecer reversiones al rango

**Temporada de alts**: cuando BTC consolida despues de subida fuerte, las alts lideran.
El bot debe aumentar candidatos de alts en este regimen.

---

## 7. NOTICIAS Y CATALIZADORES

Eventos que mueven el mercado (el bot debe ser consciente del contexto):

**Alto impacto** (evitar entrar 2h antes/despues):
- FOMC / Fed decisions (cada 6 semanas)
- CPI / datos de inflacion USA
- Halving de BTC (cada 4 anos)
- ETF approvals / rejections

**Impacto moderado** (operar con cautela):
- Reportes de ganancias de empresas crypto (Coinbase, MicroStrategy)
- Actualizaciones de protocolo importantes (Ethereum upgrades)
- Regulacion de paises grandes (China, USA, EU)

**Catalizadores de alts** (oportunidades):
- Listados en exchanges grandes (Binance, Coinbase)
- Partnerships con empresas grandes
- Actualizaciones de protocolo propias

**Regla**: si no hay catalizador conocido y el volumen es 5x normal = ballena actuando.
No perseguir — esperar setup tecnico claro.

---

## 8. SESIONES DE MERCADO (timing)

| Sesion | Horario UTC | Caracteristica |
|--------|-------------|----------------|
| Asia | 00:00-08:00 | Volumen bajo, movimientos lentos, manipulacion frecuente |
| Londres | 07:00-16:00 | Aumenta volatilidad, breakouts reales |
| NY Open | 13:00-17:00 | Maximo volumen, mejores setups, tendencias se confirman |
| NY Close | 21:00-00:00 | Volatilidad decrece, evitar nuevas entradas |

**Mejor momento para el bot**: 13:00-21:00 UTC (overlap Londres-NY).
**Peor momento**: 00:00-07:00 UTC (Asia sola, manipulacion alta).

El bot debe ponderar el timing en su analisis. Una senal identica tiene mas valor
durante NY Open que durante la sesion asiatica.

---

## 9. GESTION DE POSICION (como llegar a 130R/mes)

El edge no solo esta en ENTRAR bien — esta en GESTIONAR bien:

1. **Entry en el nivel** (limit cuando sea posible, market solo en breakouts)
2. **Stop bajo el swing** (no porcentaje fijo — estructura del precio)
3. **BE a +1R** (elimina el riesgo, sube el PF sin afectar WR)
4. **Parcial 50% en 2R** (asegura ganancia, deja correr el 50%)
5. **Trailing del resto** hacia 3R, 4R, 5R siguiendo EMA20 o swings
6. **Sin mover el stop en contra** (jamas ampliar el riesgo)

Con esta gestion, un trade con RR 2.2 inicial puede llegar a 4-6R real.
Eso es lo que separa 130R/mes de 60R/mes.

---

## Checklist A+ para el bot (requiere 4+ de 7)

- [ ] EMA 20/50/200 alineadas en la direccion del trade
- [ ] RSI en zona correcta (no sobreextendido en contra)
- [ ] Volumen confirma la direccion (>1.5x media en velas a favor)
- [ ] No hay resistencia/soporte importante en las proximas 1.5R
- [ ] Sesion favorable (preferir NY Open o overlap)
- [ ] BTC no esta en movimiento fuerte contrario
- [ ] Score tecnico interno >= 78 (majors >= 88)

Si < 4 criterios: SKIP. No hay trade.
Si 4-5: trade con size normal (1R)
Si 6-7: trade A+ con hasta 1.5R (excepcional)

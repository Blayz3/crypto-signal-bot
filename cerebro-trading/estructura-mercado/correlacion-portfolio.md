---
title: Correlación y riesgo de cartera
type: riesgo
tags: [correlacion, portfolio, cartera, riesgo, exposicion, diversificacion]
bias: [long, short]
regime: [any]
timeframe: [any]
weight: high
---

# Correlación y riesgo de cartera

Varios trades a la vez NO son independientes si las monedas están correlacionadas. Abrir 5
longs en alts correlacionadas no es diversificar: es **el mismo trade ×5**.

**Riesgos de correlación:**
- Casi todas las alts se mueven con **BTC** ([[correlacion-btc]]). 5 longs en alts = una
  apuesta apalancada a que BTC sube. Si BTC cae, los 5 stops saltan juntos.
- Riesgo real de cartera = suma del riesgo de posiciones correlacionadas, no el de una sola.

**Reglas de exposición:**
- **Limita la exposición total** en la misma dirección/correlación (ej. máx 2-3 posiciones
  correlacionadas a la vez, o reduce el tamaño de cada una).
- Si ya tienes longs en alts, un nuevo long en otra alt **suma** riesgo BTC, no diversifica.
- Diversificar de verdad = direcciones o activos poco correlacionados (raro en crypto).

**Regla para el bot:** LÍMITE DURO: máximo 2 señales simultáneas en la misma dirección sobre alts correlacionadas — más que eso es UNA sola apuesta contra BTC con riesgo multiplicado (lección 2026-06-12: cluster de 4 shorts = −4R juntos). Si hay más candidatas en la misma dirección, elige las 2 de mayor confluencia y descarta el resto. Trata el riesgo del cluster como un solo R.

Relacionado: [[correlacion-btc]], [[tamano-posicion]], [[riesgo-de-ruina]], [[limite-perdida-diaria]]

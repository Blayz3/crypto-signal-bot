---
title: Canales (tendencia) y sus bordes
type: setup
tags: [canal, channel, tendencia, lineas-tendencia, fade, ruptura]
bias: [long, short]
regime: [trending]
timeframe: [1h, 4h, 1d]
weight: medium
---

# Canales (tendencia) y sus bordes

Un **canal** son dos líneas de tendencia paralelas que contienen el precio. Define la
estructura de una tendencia y da niveles dinámicos para operar de borde a borde.

## Tipos
- **Ascendente:** mínimos y máximos crecientes entre dos líneas que suben. Sesgo alcista.
- **Descendente:** máximos y mínimos decrecientes, líneas que bajan. Sesgo bajista.
- **Horizontal (rango):** líneas planas (es un rango, [[tendencia-vs-rango]]).

## Cómo operarlo (de borde a borde)
- **A favor de tendencia (más fiable):** en canal ascendente, compra en el **borde inferior**
  (soporte dinámico) con confirmación; vende/toma en el borde superior. Inverso en descendente.
- **Fade del borde superior:** cuando el precio llega al **techo del canal** (resistencia) y
  da rechazo, es un fade hacia el borde opuesto — sobre todo si coincide con un nivel HTF,
  nPOC o value area ([[fade-rechazo-nivel]], [[naked-poc]]). La imagen muestra esto: precio
  llega al tope del canal + resistencia y rechaza con un techo.
- **Confluencia con Volume Profile:** un canal cuyo soporte/resistencia coincide con un HVN o
  el borde del value area = zona de reacción de alta calidad ([[volume-profile]]).
- **Ruptura del canal:** un cierre decidido fuera del canal (con volumen) avisa de aceleración
  o cambio de tendencia → opera el retest del borde roto ([[retest]]).

**Cuidado:** los canales se "ven" claros en retrospectiva. Necesitas ≥2 toques en cada línea
para que sea válido, y el borde debe coincidir con confluencia (nivel/VP) para operarlo.

**Regla para el bot:** En un canal válido (≥2 toques por línea), opera de borde a borde a favor de la tendencia: compra el borde inferior del ascendente, fadea el borde superior con rechazo, mejor en confluencia con nivel HTF/nPOC/value area. Una ruptura con volumen del canal = opera el retest del borde roto.

Relacionado: [[fade-rechazo-nivel]], [[volume-profile]], [[naked-poc]], [[retest]], [[bias-direccional]]

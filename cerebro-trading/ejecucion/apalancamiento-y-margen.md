---
title: Apalancamiento y margen
type: riesgo
tags: [apalancamiento, leverage, margen, liquidacion, futuros, isolated, cross]
bias: [long, short]
regime: [any]
timeframe: [any]
weight: high
---

# Apalancamiento y margen

El apalancamiento permite controlar una posición mayor que tu capital. **Multiplica
ganancias y pérdidas por igual** y, mal usado, liquida la cuenta.

## Conceptos
- **Margen:** el capital que bloqueas como garantía de la posición.
- **Precio de liquidación:** el precio al que pierdes el margen y la posición se cierra
  forzosamente. Cuanto mayor el apalancamiento, **más cerca** está la liquidación.
- **Aislado (isolated):** el riesgo se limita al margen de esa posición (recomendado).
- **Cruzado (cross):** usa todo el saldo como margen → una mala posición puede liquidar la
  cuenta entera. Más peligroso.

## La verdad sobre el apalancamiento
El apalancamiento **NO define tu riesgo**. El riesgo lo define el **% de cuenta arriesgado
y la distancia al stop** ([[tamano-posicion]]). Con tamaño calculado por el stop, usar 3x
o 10x no cambia cuánto pierdes si te sacan en el stop — pero un apalancamiento alto con un
stop ancho **acerca la liquidación antes que tu stop**, y eso sí te arruina.

**Peligro #1 de las cuentas pequeñas:** apalancamiento alto buscando 40x rápido → una mecha
te liquida antes de que el setup falle. Mantén el apalancamiento moderado y deja que mande
el stop, no la liquidación.

**Regla para el bot:** Trata el riesgo por el stop y el % de cuenta, no por el apalancamiento. Avisa si el stop está tan lejos que requeriría apalancamiento que acerque la liquidación al precio. Prefiere margen aislado y apalancamiento moderado; nunca dependas de la liquidación como stop.

Relacionado: [[tamano-posicion]], [[stop-loss]], [[plan-de-trading]], [[liquidaciones]]

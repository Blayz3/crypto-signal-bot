---
title: Gestión de la posición (escalar, TP parcial, break-even)
type: estructura
tags: [gestion, escalar, parcial, take-profit, break-even, posicion]
bias: [long, short]
regime: [any]
timeframe: [any]
weight: high
---

# Gestión de la posición

Cómo manejas un trade abierto define gran parte del resultado. No es solo entrar y esperar.

## Entrar y salir por partes (scaling)
- **Escalar la entrada:** dividir la entrada en 2-3 órdenes límite dentro de la zona, por
  si el precio profundiza. Mejora el precio medio y reduce el riesgo de timing.
- **Salir por partes (TP parcial):** cerrar una porción (ej. 50%) en el primer target y
  **dejar correr el resto** hacia un target más lejano. Asegura ganancia y captura
  movimientos grandes.

## Break-even (proteger el capital)
Al alcanzar ~1R de ganancia (o el primer target), **mueve el stop a break-even** (al precio
de entrada). A partir de ahí el trade no puede perder: es "gratis". Es una de las acciones
que más mejora la curva de capital.

## Reglas
- **Nunca muevas el stop en contra** para "darle espacio" (eso convierte un perdedor chico
  en uno grande).
- Mover el stop **solo a favor** (break-even, luego trailing — ver [[trailing-stop]]).
- Plan de salida definido **antes** de entrar; no improvisar con la posición abierta.

**Regla para el bot:** Propón tomar TP parcial en el primer target y dejar correr el resto; al llegar a 1R sugiere mover el stop a break-even. Nunca sugieras alejar el stop. Define el plan de salida en la señal.

Relacionado: [[trailing-stop]], [[stop-loss]], [[rr-minimo]], [[objetivo-profit]]

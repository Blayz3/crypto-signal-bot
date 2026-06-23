---
title: Vela envolvente (engulfing)
type: patron-vela
tags: [vela, engulfing, envolvente, reversion, confirmacion]
bias: [long, short]
regime: [any]
timeframe: [15m, 1h, 4h]
weight: medium
---

# Vela envolvente (engulfing)

Una vela cuyo cuerpo **envuelve por completo** el cuerpo de la anterior, mostrando
que la presión cambió de manos.

- **Engulfing alcista:** vela verde cuyo cuerpo cubre el cuerpo rojo previo. Señal de
  posible giro al alza.
- **Engulfing bajista:** vela roja que cubre el cuerpo verde previo. Posible giro a la baja.

**Qué le da validez (contexto > patrón):**
- Aparece **en un nivel clave** (soporte/resistencia, EMA) o tras un movimiento extendido.
- Buen **volumen** en la vela envolvente.
- A favor de la tendencia mayor (como gatillo de un pullback) > contra-tendencia.

**Cuándo ignorarlo:** en medio de un rango sin nivel, o como señal aislada sin
confluencia. Solo no basta.

**Regla para el bot:** Usa el engulfing como CONFIRMACIÓN de entrada en un nivel/EMA, no como señal por sí sola. Súmalo a la confluencia; no operes un engulfing suelto en medio de la nada.

Relacionado: [[rechazo-soporte-resistencia]], [[pullback-tendencia]], [[pin-bar]]

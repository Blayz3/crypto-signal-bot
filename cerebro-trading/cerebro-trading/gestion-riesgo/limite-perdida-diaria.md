---
title: Límite de pérdida diaria
type: riesgo
tags: [riesgo, limite, drawdown, disciplina, tilt]
bias: [long, short]
regime: [any]
timeframe: [any]
weight: medium
---

# Límite de pérdida diaria

Tope de pérdida que, al alcanzarse, **detiene la operativa del día**. Protege contra
el "tilt": operar peor tras perder, persiguiendo la recuperación.

**Parámetros típicos:**
- **Límite diario:** −3% del capital, o 3 pérdidas seguidas → parar hasta mañana.
- **Límite semanal:** −6% a −8% → revisar qué falla antes de seguir.
- Tras tocar el límite: nada de "una más para recuperar". Eso es exactamente lo que
  convierte un mal día en un mal mes.

**Por qué importa para el WR:** las peores decisiones vienen después de perder. Cortar
la sesión preserva la calidad del proceso y evita que una racha normal se vuelva ruina.

**Regla para el bot:** Si en el diario el día acumula −3% o 3 pérdidas seguidas, deja de emitir nuevas señales hasta el día siguiente y avisa que se alcanzó el límite diario.

Relacionado: [[proceso-sobre-resultado]], [[tamano-posicion]]

# 🧠 Cerebro de Trading

Base de conocimiento que el bot **inyecta en sus decisiones** para operar con un
criterio consistente y subir el win rate. No es solo para leer: el bot recupera
las notas relevantes a cada setup y se las da a la IA antes de decidir una entrada.

## Estructura

| Carpeta | Qué contiene |
|---|---|
| `00-principios/` | Filosofía base: expectativa, WR vs R:R, proceso sobre resultado. |
| `gestion-riesgo/` | Tamaño de posición, stops, R:R mínimo, límite de pérdida. Lo que protege el capital. |
| `setups/` | Playbooks concretos de entrada (pullback, ruptura, BOS, rechazo). |
| `patrones-velas/` | Patrones de velas y cuándo sí/no operarlos. |
| `patrones-chart/` | Patrones de gráfico (banderas, triángulos, doble techo/suelo). |
| `estructura-mercado/` | Tendencia vs rango, correlación con BTC, niveles clave, contexto. |
| `diario/` | Registro automático de cada señal y su resultado. Aquí se mide y mejora el WR. |
| `_templates/` | Plantillas para añadir notas y entradas de diario. |

## Cómo el bot usa cada nota (frontmatter)

Cada nota tiene metadatos que el bot usa para recuperarla:

```yaml
---
title: Nombre de la nota
type: principio | riesgo | setup | patron-vela | patron-chart | estructura
tags: [pullback, tendencia, ema]
bias: [long, short]        # a qué dirección aplica
regime: [trending]          # trending | ranging | any
timeframe: [15m, 1h, 4h]    # o [any]
weight: high                # high | medium | low — peso en la decisión
---
```

El cuerpo termina con **`Regla para el bot:`** — una línea accionable que la IA puede aplicar directo.

## Cómo subir el WR con este cerebro

1. **Curaduría:** añade solo setups que entiendes y que tienen edge. Calidad > cantidad.
2. **Riesgo primero:** las notas de `gestion-riesgo/` se inyectan siempre.
3. **Diario:** el bot registra cada señal; tú marcas el resultado. Con datos, el cerebro
   aprende qué setups ganan y la IA prioriza esos.
4. **Itera:** revisa el diario cada semana; sube el `weight` de lo que funciona, baja lo que no.

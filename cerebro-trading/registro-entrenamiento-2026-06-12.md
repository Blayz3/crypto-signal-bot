# Registro de entrenamiento — 2026-06-12

Sesión de entrenamiento del cerebro + agentes de CryptoSignalBot. (Sin frontmatter a
propósito: esta nota es para Ed, el bot no la inyecta.)

## Arreglos en la app
- **Error "no puede acceder al server": era la API key vieja de OpenRouter (401).** Key nueva
  colocada en `.env` y verificada con un escaneo real exitoso.
- Modelos: primario `qwen3-next-80b` (free); añadido `qwen3-coder:free` como primer fallback
  (únicos qwen/deepseek free disponibles hoy en OpenRouter; `deepseek-r1` queda como paid).
- `exchange.js`: excluidas stablecoins y oro (USDC, USD1, RLUSD, XAUT, PAXG…) del top por
  volumen — contaminaban backtests y escaneos.
- `scanner.js`: **2 guardias nuevas en código** — rechazo mecánico de señales con R:R < 2 y
  tope de 2 señales por dirección por escaneo (anti-cluster de correlación).
- `confluence.js`: implementado el factor ADX (≥25 con EMAs alineadas vota por la tendencia).
- `ai.js`: prompt del agente reescrito (filtro A+, confianza calibrada por confluencia,
  gestión BE/parcial/trailing en cada señal) y `analyze()` blindado contra fugas de
  razonamiento de los modelos.
- `brain.js`: ahora inyecta los **playbooks completos** (top 3 relevantes) además de las
  reglas de una línea; contexto subido a 10 notas.
- Todos los archivos tocados tienen backup `.bak` junto al original.

## Entrenamiento del cerebro
- Nuevos setups con playbook paso a paso: `momentum-continuacion` (el #1 por datos) y
  `squeeze-funding` (contrarian crypto con funding/OI/liquidaciones).
- Playbooks de 7 pasos añadidos a: pullback-tendencia, breakout-retest, liquidity-grab-reversal.
- `filtro-a-plus.md`: la puerta de calidad para PF>3 (5 condiciones, todas obligatorias).
- Meta mensual subida a **120R con PF>3** y la matemática honesta de cómo se persigue.
- R:R mínimo endurecido a **2** (antes 1.5).
- Correlación promovida a tipo `riesgo` (se inyecta SIEMPRE) con límite duro de 2/dirección.

## Datos (backtests del día, 90 días, universo limpio)
- Ranking por setup: **momentum-macd PF 1.18 (+0.10R/trade)** — único con edge mecánico claro;
  rechazo-sr y pullback-ema ~planos; retest/ruptura/rsi-reversion negativos → pesos ajustados.
- Búsqueda PF≥3: 30 configs lo daban in-sample, **ninguna sobrevivió out-of-sample**.
  Lo robusto: momentum ADX≥35, stop 2×ATR, targets 4-6R → **PF ≈ 2.0, 0.55R/trade, WR 44%**.
  → `min_adx` subido a 30 en config; el A+ exige 35 vía cerebro.
- **Primeros 5 trades reales evaluados contra precio:** 4 shorts del mismo barrido = −4R
  (cluster de correlación + shorts tardíos en miedo extremo); el único ganador fue el
  contrarian DOGE long +2.04R. Lecciones escritas en cada nota del diario y en
  `lecciones-aprendidas.md`. Mes actual: −1.96R.

## Verdad incómoda (no la pierdas de vista)
Un PF≥3 mecánico estable NO existe en estos datos — se comprobó dos veces. El plan real:
motor mecánico con edge modesto (PF ~2) + capa IA ultra-selectiva (filtro A+) + gestión de
runners. La meta de 120R/mes exige ~5-6 trades A+ buenos al día con expectativa ~1R; si un
mes da 60R limpios siguiendo el proceso, es un éxito.

## Siguiente sesión
1. Marcar resultados (Ganada/Perdida/BE) de cada señal nueva en la app — el cerebro aprende de eso.
2. Con 30-50 trades cerrados: re-entrenar pesos por setup con datos reales (no backtest).
3. Evaluar si subir `min_adx` a 35 si el flujo de señales lo aguanta.
4. Considerar walk-forward mensual automático (`setups-backtest.js` como tarea programada).

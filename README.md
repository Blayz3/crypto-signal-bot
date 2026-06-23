# Crypto Signal Bot 🪙📈

App de escritorio (Electron) para Mac que escanea el mercado crypto, filtra con
indicadores técnicos y usa IA gratis (vía OpenRouter) para proponer entradas
**long/short** con entrada, stop, target y nivel de confianza. Tiene dos modos:

1. **Escaneo rápido** — indicadores del exchange + IA de texto (Qwen). Segundos.
2. **Escaneo con TradingView 👁** — el bot **controla la app nativa de TradingView**,
   recorre tus gráficos por temporalidad, los **captura**, una **IA de visión**
   (Gemma-4) los lee, y la IA de decisión combina indicadores + lectura visual.

## Cómo funciona (el "embudo")

Con muchas monedas no se puede mandar todo a la IA (los modelos gratis tienen
límite de peticiones). Por eso:

```
Tu watchlist (o top 50 por volumen)
        │
        ▼  indicadores locales (RSI, EMA, MACD, Bollinger, ATR, ADX) — gratis e instantáneo
   ranking por confluencia (multi-timeframe)
        │
        ├─ modo rápido ─▶ las mejores → IA de texto (Qwen) decide
        │
        └─ modo visual ─▶ el bot abre cada una en TradingView, recorre temporalidades,
                          captura el gráfico → IA de visión (Gemma-4) lo lee →
                          IA de decisión combina indicadores + visión
        │
        ▼
   Notificación macOS + tarjeta en la app + botón "Abrir en TradingView"
```

## Modelos de IA (gratis, vía OpenRouter)

Los modelos `:free` rotan y a veces se saturan (error 429), así que el bot tiene
una **cadena de respaldo**: si el modelo principal falla, prueba el siguiente
automáticamente. Configurable en `config.json > ai`:
- Decisión: `qwen/qwen3-next-80b-a3b-instruct:free` (+ respaldos Llama/Nemotron/GPT-OSS).
- Visión: `google/gemma-4-31b-it:free` (+ respaldos Nemotron-VL/Gemma-26b).
- DeepSeek ya **no** es gratis en OpenRouter; queda en `decision_model_paid` para
  activarlo con un poco de crédito (cuesta centavos) cuando quieras.

## 🧠 El cerebro de trading (Obsidian)

El bot no decide en el vacío: lee una **bóveda Obsidian** con tu conocimiento de
trading (`~/Desktop/cerebro-trading`) y le inyecta a la IA las notas relevantes a
cada setup. Esto es lo que da un criterio consistente y sube el win rate.

```
Bóveda Obsidian (principios · riesgo · setups · patrones · estructura)
   → el bot deriva el régimen (tendencia/rango) del candidato
   → recupera notas relevantes (siempre incluye principios + reglas de riesgo)
   → las inyecta en el prompt de decisión de la IA
   → cada señal se registra en diario/ → marcas el resultado → aprende qué funciona
```

- **Curar el cerebro** = editar/añadir notas markdown en la bóveda. Usa la plantilla
  `_templates/plantilla-nota.md`. Cada nota tiene frontmatter (`bias`, `regime`,
  `timeframe`, `weight`) que el bot usa para recuperarla, y una línea
  **`Regla para el bot:`** que es la esencia accionable.
- **Diario con aprendizaje:** cada señal se guarda en `diario/`. Marca su resultado:
  ```bash
  npm run journal                              # lista trades abiertos
  node scripts/journal-result.js <archivo> win 2.0
  node scripts/journal-result.js <archivo> loss -1
  ```
  Con los resultados, el bot calcula WR y expectativa por setup y prioriza lo que gana.
- **Límite de pérdida diaria:** si el diario acumula −3% (o 3 pérdidas seguidas) en el
  día, el bot **frena** nuevas señales. Configurable en `config.json > brain`.
- Apágalo con `brain.enabled: false` si quieres decisiones sin cerebro.

## Puesta en marcha

1. **Instala dependencias** (ya hecho si corriste `npm install`):
   ```bash
   npm install
   ```
2. **Consigue una API key gratis** en https://openrouter.ai/keys
   (no requiere tarjeta).
3. **Configura tu key**:
   ```bash
   cp .env.example .env
   # edita .env y pega tu OPENROUTER_API_KEY
   ```
4. **Prueba el motor rápido desde la terminal** (sin abrir la app):
   ```bash
   npm run scan
   ```
5. **Abre la app**:
   ```bash
   npm start
   ```

### Modo visual (el bot controla TradingView)

Este modo requiere permisos del sistema porque el bot envía teclas y captura pantalla:

1. **Permiso de Accesibilidad** (para enviar teclas): Ajustes del Sistema →
   Privacidad y seguridad → **Accesibilidad** → activa tu Terminal (o la app).
2. **Permiso de Grabación de pantalla** (para capturar el gráfico): Ajustes →
   Privacidad y seguridad → **Grabación de pantalla** → activa tu Terminal (o la app).
3. **Valida el control** con TradingView abierto (no toques el teclado ~15s):
   ```bash
   npm run tv-test            # usa BTCUSDT
   npm run tv-test ETHUSDT    # otro símbolo
   ```
   Revisa las capturas en `/tmp/csb-captures/` y confirma que se ve el gráfico correcto.
4. **Escaneo visual completo**:
   ```bash
   npm run visual-scan
   ```
   O desde la app, botón **"Escanear con TradingView 👁"**.

> El bot controla el teclado: deja TradingView al frente y no escribas mientras corre.
> Si los atajos no cambian símbolo/temporalidad, ajusta los `delay_*_ms` y
> `timeframe_keys` en `config.json > tradingview`.

## Configuración — `config.json`

| Campo | Qué hace |
|---|---|
| `exchange` | Exchange de ccxt: `binance`, `bybit`, `kucoin`, `mexc`… |
| `quote` | Moneda de cotización (normalmente `USDT`). |
| `timeframes` | Temporalidades a analizar. La IA decide scalp vs swing según éstas. |
| `watchlist` | **Tu lista de favoritos.** Ej: `["BTC","ETH","SOL/USDT"]`. Vacío = top por volumen. |
| `auto_top_volume` | Cuántas monedas usar si `watchlist` está vacío. |
| `funnel.min_local_score` | Umbral mínimo de confluencia para llegar a la IA. |
| `funnel.max_ai_candidates` | Máx. monedas que ven la IA por escaneo (cuida el rate limit). |
| `ai.decision_model` | Modelo de decisión (Qwen gratis). |
| `ai.decision_model_fallbacks` | Modelos de respaldo si el principal se satura (429). |
| `ai.vision_model` | Modelo de visión que lee el gráfico (Gemma-4 gratis). |
| `ai.use_vision` | `true` para activar visión también en el escaneo rápido. |
| `tradingview.app_name` | Nombre de la app a controlar (por defecto `TradingView`). |
| `tradingview.delay_*_ms` | Pausas tras activar/cambiar símbolo/temporalidad/capturar. |
| `tradingview.max_symbols_visual` | Cuántas monedas (priorizadas) recorre en TradingView. |
| `tradingview.timeframe_keys` | Mapa temporalidad → teclas de TradingView. |
| `notify.min_confidence` | Confianza mínima para notificarte. |
| `brain.*` | Cerebro Obsidian: ruta de la bóveda, nº de notas inyectadas, límites de pérdida. |
| `marketdata.enabled` | Datos de mercado en vivo (funding, ballenas, sentimiento, noticias). |
| `marketdata.whale_trade_usd` | Umbral en USD para contar un trade como "ballena". |
| `marketdata.news_source` | `rss` (sin llave) o `cryptopanic` (con `CRYPTOPANIC_API_KEY`). |

## App nativa (Swift) — interfaz principal

La interfaz recomendada es la **app Swift** en [`swift-app/`](swift-app/): bonita, simple,
con botón **Analizar**, interruptor **Automático** (cada 5/10/15/30 min), **gráfico real**
con el setup dibujado por señal, e **historial** de ganadas/perdidas + WR.

```bash
cd swift-app && swift run
```

## Datos de mercado en vivo (el "edge")

En cada decisión el bot inyecta contexto público real (`src/core/marketdata.js`):
sentimiento (Fear & Greed), mercado global y dominancia BTC (CoinGecko), funding rate y
flujo de ballenas (exchange), y noticias (RSS o CryptoPanic). El cerebro tiene notas en
`datos-mercado/` que enseñan a la IA qué hacer con cada dato. Llaves opcionales gratis
(CryptoPanic, Whale Alert) en `.env`.

### Tu lista de favoritos de TradingView

TradingView no permite exportar la watchlist por API. Para usar la tuya:
copia los símbolos (botón derecho en la watchlist → o míralos a ojo) y pégalos
en `watchlist` dentro de `config.json`. Acepta `BTC`, `BTCUSDT` o `BTC/USDT`.

## Hoja de ruta

- [x] **Fase 1** — Datos del exchange + indicadores + decisión IA (Qwen) + UI + notificaciones.
- [x] **Fase 2** — El bot controla TradingView, captura gráficos y Gemma-4 los lee (visión).
- [ ] **Fase 3** — Marcar la entrada automáticamente en el gráfico de TradingView (UI).
- [ ] **Fase 4** — Registro de señales + backtest del rendimiento de las sugerencias.
- [ ] **Fase 5 — Auto-ejecución** — que el bot **opere solo**. Importante: la ejecución
  fiable de órdenes va por el **exchange** (ccxt + API keys con permiso de trade), **no**
  controlando TradingView (que no tiene API y es frágil). TradingView se usa para mirar.
  Candados obligatorios antes de dinero real: *paper trading* → *testnet* del exchange →
  tamaño de posición fijo y pequeño → stop-loss siempre → límite de pérdida diaria →
  kill switch.

## Cómo se logra que "opere solo" (Fase 5)

```
Señal del bot ─▶ (opcional) confirmación tuya ─▶ ccxt coloca la orden en el EXCHANGE
                                                  (Binance/Bybit) con tus API keys
TradingView = solo visualización; NO ejecuta.
```

## ⚠️ Aviso

Esto es una herramienta de **apoyo a la decisión**, no asesoría financiera.
El trading de crypto con apalancamiento puede liquidar tu capital. Las señales
de la IA pueden estar equivocadas. Empieza en modo "solo avisar" y valida cada
entrada tú mismo antes de operar.

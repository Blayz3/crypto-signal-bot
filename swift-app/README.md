# Crypto Signal Bot — App nativa (Swift)

Interfaz nativa de macOS, bonita y simple. Por debajo ejecuta el motor Node del
proyecto (`../src/core/scanner.js`), con el cerebro de Obsidian y la IA ya integrados.

## Qué hace

- **⚡ Analizar** — escanea el mercado ahora y muestra los trades (entrada, stop, target,
  R:R, confianza y el setup del cerebro aplicado).
- **🔄 Automático** — el bot escanea solo cada X minutos (10 por defecto, elegible
  5/10/15/30) para no agotar los tokens de la IA.
- **📈 Gráfico real** — toca cualquier señal (o entrada del historial) y se abre un gráfico
  de velas (TradingView Lightweight Charts) con el **setup dibujado**: líneas de entrada,
  stop y target, para ver si el trade salió bien o mal.
- **🕑 Historial** — pestaña con todas las señales registradas, cuáles ganamos y cuáles no,
  con el Win Rate y la expectativa acumulada. En cada trade abierto hay botones
  **Ganada / Perdida / BE** para marcar el resultado (se guarda en el diario).

## Persistencia (no se borran los datos)

No hace falta una base de datos aparte: cada señal se guarda como un archivo `.md` en
`~/Desktop/cerebro-trading/diario/`. **Eso persiste al cerrar la app** y, además, lo
puedes abrir en Obsidian. El historial de la app lee esos archivos. Marcar un resultado
edita su archivo. (La pestaña "Señales" muestra el último escaneo; el historial completo
vive en el diario.)

> El gráfico carga la librería de TradingView desde internet (CDN), así que necesita
> conexión la primera vez que abres un gráfico.

## Requisitos

- **Xcode / Swift** (ya instalado).
- El motor Node funcionando: dependencias instaladas (`cd .. && npm install`) y tu
  `OPENROUTER_API_KEY` en `../.env`.

## Cómo ejecutarla

```bash
cd ~/crypto-signal-bot/swift-app
swift run            # compila y abre la app
```

La primera vez tarda en compilar; luego abre al instante.

## Si no aparecen señales o da error

- Verifica que el motor corre solo: `cd ~/crypto-signal-bot && npm run scan`.
- La app usa `node` en `/usr/local/bin/node`. Si tu node está en otra ruta, edítala en
  `Sources/CryptoSignalBot/ScanService.swift` (`nodePath`).
- El proyecto Node se asume en `~/crypto-signal-bot` (`projectDir` en el mismo archivo).

## Empaquetar como .app (opcional, más adelante)

`swift run` lanza la app para uso diario. Si quieres un `.app` con icono para el Dock,
se puede empaquetar con un bundle o migrar a un proyecto Xcode; lo dejamos como mejora.

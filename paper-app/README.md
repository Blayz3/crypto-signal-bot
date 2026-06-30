# Crypto Paper — app para Mac y iPhone

App SwiftUI (una sola base de código para **macOS + iOS**) que muestra la cuenta de
**paper trading** del bot en TIEMPO REAL:

- **Resumen:** equity, balance, P&L realizado/no realizado, win rate y la **gráfica del
  dinero ganado/perdido** (curva de equity).
- **Posiciones:** posiciones abiertas con P&L en vivo (precios de KuCoin cada 10 s).
- **Historial:** trades cerrados con su resultado en $.

## De dónde saca los datos

El bot publica `cerebro-trading/paper-account.json` en GitHub cada ciclo. La app lo lee
desde la URL "raw" (cada 60 s) y refresca el P&L de las posiciones abiertas con precios
en vivo de KuCoin (cada 10 s). No necesita servidor ni llaves.

Reglas de paper trading: **$200 de margen por trade**, **20x si el precio < $20, 40x si ≥ $20**,
pérdida tope = el margen (liquidación). Balance inicial $1000 (editable en `config.json` → `paper`).

## Abrir y correr

Requiere **Xcode** (ya tienes 26.5).

```bash
cd ~/crypto-signal-bot/paper-app
xcodegen generate          # genera CryptoPaper.xcodeproj (ya está generado)
open CryptoPaper.xcodeproj
```

En Xcode:
- **En Mac:** elige el destino "My Mac" → ▶︎ Run.
- **En iPhone:** conecta el iPhone (o un simulador), en *Signing & Capabilities* elige tu
  *Team* (tu Apple ID gratis sirve), elige tu iPhone como destino → ▶︎ Run.

> Si cambias de repo, edita `accountURL` en `Sources/AccountStore.swift`.

## Regenerar el proyecto

Si agregas/quitas archivos Swift, corre `xcodegen generate` otra vez.

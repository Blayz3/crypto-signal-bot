#!/bin/bash
# Corre el análisis NY Open + el trade automático BTC cuando son las 8 AM en NY.
# launchd lo dispara a las 6:10 y 7:10 hora local (Tegucigalpa, UTC-6);
# solo una coincide con las 8 AM NY (depende de DST de USA).

NY_HOUR=$(TZ=America/New_York date +%H)
if [ "$NY_HOUR" = "08" ]; then
  cd "$HOME/crypto-signal-bot" || exit 1
  STAMP=$(TZ=America/New_York date '+%Y-%m-%d %H:%M %Z')

  echo "=== $STAMP — NY Open análisis ==" >> "$HOME/crypto-signal-bot/ny-open.log"
  /usr/local/bin/node scripts/ny-open.js BTC/USDT 270 >> "$HOME/crypto-signal-bot/ny-open.log" 2>&1

  echo "=== $STAMP — NY Open TRADE ==" >> "$HOME/crypto-signal-bot/ny-open.log"
  /usr/local/bin/node scripts/ny-open-trade.js >> "$HOME/crypto-signal-bot/ny-open.log" 2>&1
fi

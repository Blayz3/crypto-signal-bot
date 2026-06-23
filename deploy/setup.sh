#!/bin/bash
# Configura el bot en el SERVIDOR (Ubuntu/Oracle Cloud). Instala Node, dependencias
# y un cron que corre el autobot cada 15 min (24/7).  Uso:  bash deploy/setup.sh
set -e

PROJ="$HOME/crypto-signal-bot"
cd "$PROJ"

echo "1) Node.js..."
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
echo "   node $(node -v)"

echo "2) Dependencias..."
npm install --omit=dev

echo "3) Archivo .env..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo "   ⚠️  Creado .env — EDÍTALO con tus llaves:  nano $PROJ/.env"
  echo "      (OPENROUTER_API_KEY y, para 24/7, TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID)"
fi

NODE_BIN="$(command -v node)"
echo "4) Cron (autobot cada 15 min)..."
( crontab -l 2>/dev/null | grep -v 'scripts/autobot.js' ; \
  echo "*/15 * * * * cd $PROJ && $NODE_BIN scripts/autobot.js >> $PROJ/autobot.log 2>&1" ) | crontab -

echo ""
echo "✅ Instalado. El bot corre cada 15 min y manda señales a Telegram."
echo "   Edita .env si aún no lo hiciste:  nano $PROJ/.env"
echo "   Prueba ahora mismo:               node scripts/autobot.js"
echo "   Ver el log:                       tail -f $PROJ/autobot.log"
echo "   Ver el cron:                      crontab -l"

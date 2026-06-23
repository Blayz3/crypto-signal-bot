#!/bin/bash
# Empaqueta el bot + el CEREBRO en un .tar.gz listo para subir al servidor.
# Corre esto en tu MAC.  Uso:  bash deploy/bundle.sh
set -e

PROJ="$HOME/crypto-signal-bot"
VAULT="$HOME/Desktop/cerebro-trading"
cd "$PROJ"

echo "1) Copiando el cerebro dentro del proyecto (viaja con el bot)..."
rm -rf cerebro-trading
cp -R "$VAULT" cerebro-trading

echo "2) Empaquetando (sin node_modules, swift-app, .git, logs)..."
tar \
  --exclude='node_modules' \
  --exclude='swift-app' \
  --exclude='.git' \
  --exclude='*.log' \
  --exclude='.DS_Store' \
  -czf /tmp/crypto-bot-deploy.tar.gz -C "$HOME" crypto-signal-bot

SIZE=$(du -h /tmp/crypto-bot-deploy.tar.gz | cut -f1)
echo ""
echo "✅ Listo: /tmp/crypto-bot-deploy.tar.gz  ($SIZE)"
echo ""
echo "Súbelo a tu servidor Oracle (cambia <IP> por la de tu VM):"
echo "   scp /tmp/crypto-bot-deploy.tar.gz ubuntu@<IP>:~"
echo ""
echo "Luego en el servidor:"
echo "   tar -xzf crypto-bot-deploy.tar.gz && cd crypto-signal-bot && bash deploy/setup.sh"

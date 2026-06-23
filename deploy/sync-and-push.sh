#!/bin/bash
# Copia el cerebro actualizado al repo y lo sube a GitHub. Uso: bash deploy/sync-and-push.sh
set -e
cd "$HOME/crypto-signal-bot"

echo "Copiando el cerebro (Obsidian) al repo..."
rm -rf cerebro-trading
cp -R "$HOME/Desktop/cerebro-trading" cerebro-trading

git add -A
if git diff --cached --quiet; then
  echo "Sin cambios que subir."
else
  git commit -m "Actualiza cerebro/código $(date +%Y-%m-%d)"
  git push
  echo "✅ Subido. El bot en GitHub usará la versión nueva en la próxima corrida."
fi

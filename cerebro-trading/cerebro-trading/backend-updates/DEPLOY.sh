#!/bin/bash
# Despliega llm.py v4 y scanner.py v4 al backend
# Ejecuta desde Terminal: bash ~/Desktop/cerebro-trading/backend-updates/DEPLOY.sh

BACKEND=~/CryptoSignalBot/backend
UPDATES=~/Desktop/cerebro-trading/backend-updates

echo "📦 Copiando archivos..."
cp "$UPDATES/llm.py"     "$BACKEND/llm.py"
cp "$UPDATES/scanner.py" "$BACKEND/scanner.py"

echo "🔄 Reiniciando backend..."
launchctl kickstart -k gui/$(id -u)/com.ed.cryptosignalbot.backend 2>/dev/null \
  || pkill -f "uvicorn main:app" && sleep 1 \
  && cd "$BACKEND" && source .venv/bin/activate \
  && nohup uvicorn main:app --host 0.0.0.0 --port 8000 >> /tmp/csb-backend.log 2>&1 &

sleep 3
echo "✅ Verificando..."
curl -s http://localhost:8000/health | python3 -m json.tool

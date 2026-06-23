# 🤖 Bot 24/7 autónomo — Oracle Cloud (gratis para siempre)

El bot corre en una VM de **Oracle Cloud Always Free** (no se apaga nunca, no depende de
tu Mac). Cada 15 min: **monitorea** trades abiertos (los cierra cuando tocan stop/target),
**aprende** de las pérdidas (autopsia + lección), **escanea** señales nuevas con el
**cerebro** incluido, y te las **manda a Telegram**.

```
cron cada 15m  →  monitor (cierra + aprende)  →  scan (cerebro+datos+confluencia)  →  Telegram
```

## Paso 1 — Telegram (5 min, gratis) — recibe las señales en el celular
1. En Telegram, habla con **@BotFather** → `/newbot` → ponle nombre → te da un **TOKEN**.
2. Habla con **@userinfobot** → te da tu **CHAT_ID** (un número).
3. Guárdalos; van en el `.env` del servidor.

## Paso 2 — Crear la VM gratis en Oracle Cloud
1. Crea cuenta en **https://www.oracle.com/cloud/free/** (pide tarjeta para verificar, **no cobra** en el Always Free).
2. Menu → **Compute → Instances → Create Instance**.
3. **Image:** Canonical **Ubuntu** 22.04. **Shape:** elige **Ampere (ARM) — Always Free**
   (VM.Standard.A1.Flex, 1-4 OCPU / 6-24GB — todo gratis).
4. En **SSH keys**, deja que genere y **descarga la llave privada** (la usarás para entrar).
5. **Create**. Anota la **IP pública** de la instancia.

## Paso 3 — Subir el bot (desde tu Mac)
```bash
# 1) Empaqueta el bot + el cerebro
bash ~/crypto-signal-bot/deploy/bundle.sh

# 2) Súbelo a la VM (usa la llave que descargaste y la IP)
chmod 400 ~/Downloads/ssh-key-*.key
scp -i ~/Downloads/ssh-key-*.key /tmp/crypto-bot-deploy.tar.gz ubuntu@<IP>:~
```

## Paso 4 — Instalar y arrancar (en el servidor)
```bash
# Entra por SSH
ssh -i ~/Downloads/ssh-key-*.key ubuntu@<IP>

# Descomprime e instala
tar -xzf crypto-bot-deploy.tar.gz
cd crypto-signal-bot
bash deploy/setup.sh

# Pega tus llaves
nano .env     # OPENROUTER_API_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID

# Prueba ya
node scripts/autobot.js
```
Si todo va bien, te llega un mensaje a Telegram (o "sin señales A+" si el mercado está plano).
**El cron ya quedó corriendo cada 15 min**, 24/7, aunque cierres tu Mac.

## Comandos útiles (en el servidor)
```bash
tail -f autobot.log          # ver la actividad en vivo
crontab -l                   # ver el cron
node scripts/monitor.js      # forzar revisión de trades
node scripts/brief.js        # generar el brief para pegármelo en el chat
```

## Cómo aprende solo (autoaprendizaje)
- **monitor.js** cierra cada trade cuando toca stop/target/timeout.
- En **pérdida**, dispara **analyze-loss.js** → la IA encuentra la causa raíz y escribe la
  **lección** en el diario (`cerebro-trading/diario/`).
- El **diario** alimenta el contexto de las siguientes decisiones (WR/expectativa por setup,
  setups que pierden, meta mensual) → el bot **evita repetir errores y mejora solo**.
- El cerebro **viaja con el bot** (carpeta `cerebro-trading/` empaquetada). Para actualizarlo
  con cambios que hagas en tu Mac, vuelve a correr `bundle.sh` y re-sube, o usa `git`/`rsync`.

## Actualizar el cerebro o el código después
```bash
# En tu Mac: re-empaqueta y sube
bash ~/crypto-signal-bot/deploy/bundle.sh
scp -i ~/Downloads/ssh-key-*.key /tmp/crypto-bot-deploy.tar.gz ubuntu@<IP>:~
# En el servidor:
cd ~ && tar -xzf crypto-bot-deploy.tar.gz && cd crypto-signal-bot && npm install --omit=dev
```

## ⚠️ Importante
- Esto **genera y registra señales** y aprende; **NO ejecuta órdenes con dinero real** por sí
  solo. La auto-ejecución en el exchange es otra fase con candados (paper → testnet → real).
- Empieza en modo señales: tú decides si tomas cada trade. El bot mide y aprende mientras tanto.

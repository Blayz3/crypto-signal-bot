# 🤖 Bot 24/7 en GitHub Actions (GRATIS, SIN TARJETA)

GitHub corre tu bot en su nube por ti, cada hora, gratis y **sin tarjeta**. En cada corrida:
monitorea trades, aprende de las pérdidas, escanea, te manda señales a **Telegram**, y
**guarda el diario/lecciones de vuelta en el repo** (memoria persistente + autoaprendizaje).

## Paso 1 — Telegram (5 min)
- En Telegram: **@BotFather** → `/newbot` → te da el **TOKEN**.
- **@userinfobot** → te da tu **CHAT_ID** (un número).

## Paso 2 — Cuenta de GitHub (gratis, sin tarjeta)
Crea cuenta en **https://github.com/signup** si no tienes.

## Paso 3 — Subir el bot (en tu Mac, una vez)
```bash
cd ~/crypto-signal-bot

# Copia el cerebro dentro del proyecto (para que viaje al repo)
cp -R ~/Desktop/cerebro-trading ./cerebro-trading

# Inicializa git y haz el primer commit
git init -b main
git add -A
git commit -m "Bot de trading con cerebro 24/7"

# Crea el repo en GitHub (PRIVADO) y sube. Opción fácil con GitHub CLI:
#   brew install gh && gh auth login
#   gh repo create crypto-signal-bot --private --source=. --push
# O manual: crea el repo en github.com/new (privado), y luego:
git remote add origin https://github.com/<TU_USUARIO>/crypto-signal-bot.git
git push -u origin main
```

## Paso 4 — Poner tus llaves como Secrets (NO en el código)
En tu repo de GitHub: **Settings → Secrets and variables → Actions → New repository secret**.
Crea estos (con los valores reales):
- `OPENROUTER_API_KEY`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- (opcional) `CRYPTOPANIC_API_KEY`, `WHALE_ALERT_API_KEY`

## Paso 5 — Encender
- **Actions** (pestaña del repo) → si pide habilitar workflows, acepta.
- Abre el workflow **autobot** → **Run workflow** para probar ya mismo.
- Debe llegarte un mensaje a Telegram (o "sin señales A+" si el mercado está plano).
- A partir de ahí corre **solo cada hora**, 24/7, sin tu Mac. ✅

## Frecuencia y minutos gratis
- **Repo privado:** 2.000 min/mes gratis. A ~2-3 min por corrida, **cada hora alcanza** sobrado.
  Para más seguido (`*/30` o `*/15`) edita `.github/workflows/autobot.yml`, pero gastas más minutos.
- **Repo público:** minutos **ilimitados** gratis (puedes ir cada 15 min), pero el código y el
  cerebro quedan visibles. Tus llaves siguen seguras (están en Secrets, no en el código).

## Actualizar el cerebro o el código después
Cuando edites el cerebro en tu Mac (Obsidian) o el código, sube los cambios:
```bash
cd ~/crypto-signal-bot
bash deploy/sync-and-push.sh    # copia el cerebro y hace push
```

## Cómo aprende solo
El workflow, tras correr el bot, hace `git commit`/`push` del `diario/` y las `lecciones`.
Así la memoria persiste entre corridas: trades abiertos → monitor los cierra → pérdidas →
autopsia escribe la lección → alimenta las siguientes decisiones. **Mejora solo.**

## ⚠️ Nota
Genera y registra señales y aprende; **NO ejecuta órdenes reales** por sí solo.

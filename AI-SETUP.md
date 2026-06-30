# IA gratis para el bot — Google Gemini (1500 llamadas/día, sin tarjeta)

OpenRouter bajó su tier gratis a **50 llamadas/día** → el bot las quemaba en minutos
y todo salía grado C (plan mecánico). Solución: usar **Google Gemini** como IA
principal (1500 req/día gratis), con Groq y OpenRouter como respaldo automático.

El bot ya está listo para esto. Solo falta tu **key gratis de Gemini**.

## Paso 1 — Sacar la key de Gemini (gratis, sin tarjeta, 2 min)

1. Entra a https://aistudio.google.com/apikey (inicia sesión con tu cuenta de Google).
2. Click **"Create API key"** → "Create API key in new project".
3. Copia la key (empieza con `AIza...`). **NO la pegues en el chat**, solo en GitHub.

## Paso 2 — Guardarla como secret en GitHub

Opción A (terminal, recomendado):
```bash
cd ~/crypto-signal-bot
gh secret set GEMINI_API_KEY
# pega la key cuando lo pida y Enter
```

Opción B (web): repo → Settings → Secrets and variables → Actions → New repository
secret → Name `GEMINI_API_KEY`, Secret = tu key → Add secret.

## Paso 3 — Listo

En la próxima corrida del bot ya usará Gemini. Lo confirmas porque empezarán a salir
trades **grado A+/A/B** (con análisis de la IA), no solo C.

## (Opcional) Groq como respaldo extra — también gratis

Si quieres aún más cuota/resiliencia, saca una key gratis en https://console.groq.com/keys
y guárdala como `GROQ_API_KEY` (mismo proceso). El bot la usará si Gemini se cae o se
agota. No es obligatoria.

## Cómo funciona la cadena

El bot intenta los proveedores en orden y salta al siguiente si uno falla/se satura:

1. **Gemini** (gemini-2.0-flash → 2.5-flash) — principal, 1500/día.
2. **Groq** (llama-3.3-70b → deepseek-r1) — si pusiste `GROQ_API_KEY`.
3. **OpenRouter** (modelos :free) — último recurso (50/día).
4. Si TODO falla → plan mecánico por niveles (grado C). El bot nunca se queda mudo.

Configurable en `config.json` → `ai.providers`.

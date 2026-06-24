# Pinger fiable cada 30 min (gratis, con cron-job.org)

El cron de GitHub Actions se salta corridas. Este "pinger" externo llama al bot
de verdad cada 30 min. El bot ya se auto-limita al horario 5–21h (Tegucigalpa),
así que el pinger puede dispararse 24/7 sin problema.

## Paso 1 — Crear un token de GitHub (NO lo pegues en el chat)

1. Entra a https://github.com/settings/personal-access-tokens/new
   (Settings → Developer settings → Fine-grained tokens → Generate new token)
2. **Token name:** `pinger-autobot`
3. **Expiration:** 90 días (o "No expiration" si prefieres no renovar)
4. **Repository access:** "Only select repositories" → elige `Blayz3/crypto-signal-bot`
5. **Permissions** → Repository permissions → **Actions: Read and write**
6. Generate token → **copia el token** (empieza con `github_pat_...`). Lo pegas SOLO en cron-job.org.

## Paso 2 — Crear el cronjob en cron-job.org (gratis)

1. Crea cuenta gratis en https://cron-job.org → "Create cronjob".
2. **Title:** `autobot crypto`
3. **URL:**
   ```
   https://api.github.com/repos/Blayz3/crypto-signal-bot/actions/workflows/autobot.yml/dispatches
   ```
4. **Schedule:** Every 30 minutes (o cada 15 si quieres más intentos).
5. Pestaña **Advanced** (o "Show advanced"):
   - **Request method:** `POST`
   - **Headers** (añade estas 3):
     - `Accept` = `application/vnd.github+json`
     - `Authorization` = `Bearer github_pat_TU_TOKEN_AQUI`
     - `X-GitHub-Api-Version` = `2022-11-28`
   - **Request body:**
     ```json
     {"ref":"main"}
     ```
6. **Save**.

## Paso 3 — Probar

En cron-job.org pulsa "Run now" (o "Test run"). Debe responder **HTTP 204** (éxito).
Luego mira en https://github.com/Blayz3/crypto-signal-bot/actions que aparezca una
corrida de `autobot` con evento `workflow_dispatch`. Listo: a partir de ahí dispara
solo cada 30 min, de verdad.

## Notas
- Si el token expira, el pinger dará error 401 → genera uno nuevo y actualiza el header.
- El bot solo escanea 5–21h Tegucigalpa; fuera de ese horario la corrida solo monitorea
  trades abiertos (es normal ver "Fuera de horario").
- Coste: cada disparo corre ~15s → ~960 corridas/mes ≈ 4h de Actions, muy dentro del
  límite gratis (2000 min/mes).

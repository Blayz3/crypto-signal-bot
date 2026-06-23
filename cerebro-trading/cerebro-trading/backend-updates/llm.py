"""Motor LLM v4 — Multi-factor analysis con cerebro inyectado.
Core: Nemotron-120B + Claude Haiku (confiables, consenso 2/2 requerido)
Bonus: Qwen3 + Hermes-405B (gratuitos, refuerzan si responden)
El prompt ensena a los modelos: tendencia, volumen, ballenas, sesion, noticias,
Wyckoff, funding, regimen de mercado — no solo indicadores tecnicos.
"""
from __future__ import annotations
import asyncio, json, re, datetime
import httpx
from config import settings

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# ── Clasificacion de pares por comportamiento ─────────────────────────────
MAJOR_PAIRS = {
    "BTC/USDT:USDT", "ETH/USDT:USDT", "XRP/USDT:USDT",
    "SOL/USDT:USDT", "BNB/USDT:USDT", "ADA/USDT:USDT",
}

def _pair_notes(symbol: str) -> str:
    if symbol in MAJOR_PAIRS:
        return """PAR MAYOR (mercado hipereficiente):
- Score tecnico minimo requerido: 88/100. Si el score es < 88: devuelve skip.
- RSI debe estar en zona extrema: < 28 o > 72.
- Volumen de la ultima vela debe ser 2x+ sobre la media de 20 periodos.
- Las 3 EMAs (20/50/200) deben estar alineadas en la direccion del trade.
- Preferir LIMIT sobre MARKET — esperar el pullback al nivel, no perseguir.
- Estos pares tienen WR historico de 18-22% con senales tecnicas simples (backtest propio).
  Solo entrar si hay confluencia de TODOS los factores arriba. Sin excepcion."""
    else:
        return """PAR ALT (mejor comportamiento en momentum):
- Score tecnico minimo: 78/100.
- RSI entre 45-72 para long, 28-55 para short.
- Favorecer continuacion de tendencia sobre reversiones.
- Verificar volumen: debe ser >= 1.3x la media en las velas de la direccion del trade.
- Si hay compresion de rango y ruptura con volumen: senal de breakout (MARKET).
- Si hay pullback a EMA en tendencia: entrada LIMIT en el nivel."""

def _session_context() -> str:
    hour = datetime.datetime.utcnow().hour
    if 13 <= hour < 21:
        return "SESION NY OPEN/OVERLAP (13-21 UTC) — OPTIMA. Maxima liquidez, mejores setups. Senales tienen mayor validez."
    elif 7 <= hour < 13:
        return "SESION LONDRES (7-13 UTC) — BUENA. Volatilidad creciente, breakouts suelen ser reales."
    elif 0 <= hour < 7:
        return "SESION ASIATICA (0-7 UTC) — PRECAUCION. Volumen bajo, manipulacion frecuente. Subir umbral de conviccion."
    else:
        return "NY CLOSE (21-24 UTC) — BAJA PRIORIDAD. Evitar nuevas entradas si es posible."

# ── System prompt maestro ─────────────────────────────────────────────────
SYSTEM_PROMPT = """Eres un trader cuantitativo de cripto con 15 anos de experiencia en mercados perpetuos.
Tu objetivo es identificar senales A+ que contribuyan a una meta de 130R/mes con PF > WR%.

== FILOSOFIA CENTRAL ==
- Solo entras cuando HAY CONFLUENCIA de multiples factores. Un indicador solo nunca es suficiente.
- La mayoria de setups NO merecen entrada. El skip inteligente es tu ventaja principal.
- RR minimo: 2.2. Ideal: >= 2.8. Sin esto, no hay trade.
- El edge esta tanto en GESTIONAR bien como en ENTRAR bien.

== FACTORES QUE DEBES EVALUAR (todos, no solo los que aparecen en los datos) ==

1. TENDENCIA MACRO:
   - EMA 20/50/200: las 3 alineadas = tendencia fuerte. Mezcla = rango o debilidad.
   - Precio sobre EMA200 = mercado alcista. Bajo EMA200 = bajista.
   - En tendencia fuerte: favorece continuacion. En rango: favorece reversion al centro.

2. VOLUMEN (el factor mas ignorado y mas importante):
   - Precio sube + volumen sube = tendencia real. VALIDO.
   - Precio sube + volumen baja = trampa alcista. PELIGROSO.
   - Precio baja + volumen sube = tendencia bajista fuerte. SHORT valido.
   - Precio baja + volumen baja = pullback en tendencia alcista. LONG en soporte.
   - Vela con volumen 3x+ media = ACTIVIDAD DE BALLENA. Esperar confirmacion.
   - Ruptura sin volumen = fakeout con 80% de probabilidad. NO ENTRAR.

3. MOMENTUM Y ESTRUCTURA:
   - RSI 50-70 en long (momentum sin sobrecompra), 30-50 en short.
   - MACD histograma: positivo y creciendo = fuerza compradora activa.
   - Buscar: breakouts con volumen, pullbacks a EMAs, springs de Wyckoff.
   - Evitar: reversiones contra tendencia sin catalizador de volumen.

4. ACTIVIDAD DE BALLENAS (inferir de los datos disponibles):
   - ATR_pct alto + volumen anormal = posible movimiento institucional.
   - Mechas largas (wick > 2x cuerpo de la vela) = sweep de stops por ballenas.
     Oportunidad: entrar en la direccion contraria al wick despues del rechazo.
   - Si el precio rompio un nivel obvio y volvio rapido = liquidacion de un lado,
     ahora el movimiento real puede ser en la direccion contraria.

5. SESION DE MERCADO:
   - NY Open (13-21 UTC): maxima liquidez, senales mas confiables.
   - Londres (7-13 UTC): buena liquidez, breakouts suelen ser reales.
   - Asia (0-7 UTC): manipulacion frecuente, subir umbral de conviccion a 90+.
   - Evitar entrar cerca del cierre de sesion sin catalizador claro.

6. CONTEXTO MACRO CRIPTO:
   - Si BTC cae fuerte (-2%+ en 1h): evitar longs en cualquier alt.
   - Si BTC consolida en soporte: alts fuertes pueden independizarse.
   - Alta dominancia BTC (>60%): el dinero no fluye a alts. Cauteloso con longs en alts.
   - Mercado de risk-off: priorizar shorts o cash (skip).

7. ESTRATEGIAS AVANZADAS A RECONOCER:
   a) MOMENTUM TRENDING: EMAs alineadas + RSI 50-70 + volumen en velas a favor.
      Entrada LIMIT en pullback a EMA20. RR 2.5-3.5R. Alta WR (50-55%).

   b) BREAKOUT: compresion en rango + ruptura con volumen 2x+.
      Entrada MARKET en la ruptura o LIMIT en el retest. RR 3-5R. WR menor pero RR alto.

   c) WYCKOFF SPRING: precio baja bajo soporte con volumen bajo, luego rebota fuerte.
      Entrada LIMIT en el spring. RR 4-8R. Alta conviccion cuando se confirma.

   d) SQUEEZE: funding extremo + precio en resistencia/soporte.
      Si funding muy positivo + precio en resistencia = SHORT squeeze inminente.

== GESTION (para informar tu razonamiento) ==
- Stop: bajo el swing low del pullback (long) o sobre el swing high (short).
- No usar stop porcentual fijo — usar estructura del precio.
- BE a +1R tan pronto como sea posible.
- Parcial en 2R, trailing el resto a 3-6R.
- RR 2.2 minimo — sin esto el trade no tiene valor matematico.

== CALIBRACION POR HISTORIAL ==
- Pares con WR historico bajo (BTC 18%, ETH 19%, XRP 17% en 15m): UMBRAL MUY ALTO.
- Pares con WR historico alto (BEAT 55%, ESPORTS 55%, VELVET 52%): mas flexibles.
- La diferencia: majors son mercados eficientes con HFTs. Alts tienen estructura mas limpia.

== OUTPUT REQUERIDO ==
Responde SOLO con JSON valido, sin texto adicional:
{
  "decision": "long" | "short" | "skip",
  "confidence": 0-100,
  "entry": numero (precio actual o nivel de entrada),
  "stop_loss": numero (bajo/sobre estructura, no porcentaje fijo),
  "take_profit": numero (nivel tecnico objetivo, RR >= 2.2),
  "order_type": "market" | "limit",
  "limit_price": numero | null,
  "reasoning": "2-3 frases explicando: estrategia usada, factores confluentes, por que este RR"
}

Si confidence < 70 -> skip. Si RR < 2.2 -> ajustar TP o skip.
limit_price solo si order_type = limit. Si market -> null."""


def _build_prompt(symbol: str, feats: dict) -> str:
    pair_notes = _pair_notes(symbol)
    session = _session_context()

    vol = feats.get("volume", 0)
    vol_ma = feats.get("volume_ma20", 0)
    vol_ratio = round(vol / vol_ma, 2) if vol_ma > 0 else 1.0
    vol_signal = "ALTA (actividad de ballena posible)" if vol_ratio >= 3 else \
                 "ELEVADO" if vol_ratio >= 1.5 else \
                 "NORMAL" if vol_ratio >= 0.8 else "BAJO (poca participacion)"

    return f"""=== ANALISIS REQUERIDO ===
Par: {symbol} | Timeframe: {feats.get('tf', settings.timeframe)}
Precio actual: {feats['price']}

=== NOTA ESPECIFICA DEL PAR ===
{pair_notes}

=== CONTEXTO DE SESION ===
{session}

=== DATOS TECNICOS ===
Tendencia: {feats['trend']} | Senal tecnica interna: {feats['direction']}
RSI-14: {feats['rsi']:.1f} | MACD histograma: {feats['macd_hist']:.6f}
EMA20={feats['ema20']:.4g}  EMA50={feats['ema50']:.4g}  EMA200={feats['ema200']:.4g}
ATR: {feats['atr']:.4g} ({feats['atr_pct']:.2f}% del precio)
Score tecnico interno: {feats['score']}/100

=== ANALISIS DE VOLUMEN ===
Volumen ultima vela: {vol:.0f}
Media volumen 20 velas: {vol_ma:.0f}
Ratio volumen: {vol_ratio}x ({vol_signal})

=== CONFLUENCIAS TECNICAS DETECTADAS ===
{', '.join(feats['reasons']) if feats.get('reasons') else 'Ninguna destacada'}

=== INSTRUCCION ===
Evalua TODOS los factores: tendencia, volumen, momentum, tipo de par, sesion, contexto macro.
Una senal A+ necesita confluencia de 4+ factores. Si no los hay: skip.
Devuelve solo el JSON."""


def _extract(text: str) -> dict | None:
    if not text:
        return None
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()
    m = re.search(r"\{.*\}", text, re.DOTALL)
    if not m:
        return None
    try:
        return json.loads(m.group(0))
    except json.JSONDecodeError:
        return None


async def _call(client: httpx.AsyncClient, model: str,
                symbol: str, feats: dict, retries: int = 2) -> dict | None:
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": _build_prompt(symbol, feats)},
        ],
        "temperature": 0.1,
        "max_tokens":  700,
    }
    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "HTTP-Referer": "https://localhost",
        "X-Title": "CryptoSignalBot",
    }
    short = model.split("/")[-1][:22]
    for attempt in range(retries + 1):
        if attempt > 0:
            await asyncio.sleep(12 * attempt)
        try:
            r = await client.post(OPENROUTER_URL, json=payload,
                                  headers=headers, timeout=90)
            if r.status_code == 429:
                print(f"[llm] {short}: rate-limit (intento {attempt+1})", flush=True)
                continue
            if r.status_code >= 500:
                print(f"[llm] {short}: HTTP {r.status_code}", flush=True)
                continue
            r.raise_for_status()
            result = _extract(r.json()["choices"][0]["message"]["content"])
            if result:
                result["_model"] = model
                if result.get("order_type") == "market":
                    result["limit_price"] = None
                elif result.get("order_type") == "limit" and not result.get("limit_price"):
                    atr = feats.get("atr", 0)
                    e = float(result.get("entry", feats["price"]))
                    result["limit_price"] = round(
                        e - atr * 0.35 if result.get("decision") == "long"
                        else e + atr * 0.35, 8)
            return result
        except Exception as ex:
            print(f"[llm] {short}: {ex}", flush=True)
    return None


def _avg(votes: list[dict], key: str, default: float = 0.0) -> float:
    vals = [float(v[key]) for v in votes if v.get(key) is not None]
    return sum(vals) / len(vals) if vals else default


async def analyze(symbol: str, feats: dict) -> dict | None:
    """Core 2/2 consensus + bonus votes. Returns enriched signal or None."""
    if not settings.has_llm():
        return None

    core_models  = [settings.nemotron_model, settings.claude_model]
    bonus_models = [settings.qwen_model, settings.deepseek_model]

    async with httpx.AsyncClient() as client:
        all_results = await asyncio.gather(
            *[_call(client, m, symbol, feats, retries=2) for m in core_models],
            *[_call(client, m, symbol, feats, retries=1) for m in bonus_models],
        )

    core_res  = [r for r in all_results[:2] if r]
    bonus_res = [r for r in all_results[2:] if r]

    # Core debe concordar 2/2
    core_valid = [v for v in core_res if v.get("decision") not in (None, "skip")]
    if len(core_valid) < 2:
        return None
    if core_valid[0].get("decision") != core_valid[1].get("decision"):
        return None

    direction  = core_valid[0]["decision"]
    all_voters = core_valid[:]
    all_voters.extend(v for v in bonus_res if v.get("decision") == direction)

    conf  = _avg(all_voters, "confidence")
    entry = _avg(all_voters, "entry", feats["price"])
    sl    = _avg(all_voters, "stop_loss")
    tp    = _avg(all_voters, "take_profit")

    if conf < settings.min_confidence:
        return None

    rr = abs(tp - entry) / abs(entry - sl) if abs(entry - sl) > 1e-9 else 0
    if rr < settings.risk_reward_min:
        return None

    from collections import Counter
    order_type = Counter(v.get("order_type", "market") for v in all_voters).most_common(1)[0][0]
    lp_vals    = [v["limit_price"] for v in all_voters
                  if v.get("order_type") == "limit" and v.get("limit_price")]
    limit_price = round(sum(lp_vals)/len(lp_vals), 8) if lp_vals else None

    models_used = [v.get("_model", "?") for v in all_voters]
    reasoning   = max(all_voters, key=lambda v: len(v.get("reasoning", ""))).get("reasoning", "")

    strategy = _infer_strategy(feats, direction, order_type)

    print(
        f"[llm] {symbol}: {direction.upper()} {conf:.0f}% {order_type.upper()} "
        f"RR={rr:.1f} [{strategy}] — {len(all_voters)}/{len(core_res)+len(bonus_res)} votos",
        flush=True,
    )

    return {
        "symbol":             symbol,
        "decision":           direction,
        "confidence":         round(conf, 1),
        "entry":              entry,
        "stop_loss":          sl,
        "take_profit":        tp,
        "order_type":         order_type,
        "limit_price":        limit_price,
        "risk_reward":        round(rr, 2),
        "technical_score":    feats["score"],
        "reasoning":          reasoning,
        "strategy":           strategy,
        "reasons":            feats["reasons"],
        "rsi":                feats["rsi"],
        "atr_pct":            feats["atr_pct"],
        "trend":              feats["trend"],
        "timeframe":          settings.timeframe,
        "qwen_reasoning":     next((v.get("reasoning","") for v in all_voters if "qwen"   in v.get("_model","")), ""),
        "deepseek_reasoning": next((v.get("reasoning","") for v in all_voters if "hermes" in v.get("_model","") or "deepseek" in v.get("_model","")), ""),
        "models_used":        models_used,
        "session":            _session_context()[:30],
    }


def _infer_strategy(feats: dict, direction: str, order_type: str) -> str:
    rsi   = feats.get("rsi", 50)
    score = feats.get("score", 0)
    trend = feats.get("trend", "")

    if order_type == "limit" and "up" in trend and direction == "long":
        return "MOMENTUM_PULLBACK"
    if order_type == "market" and score >= 85:
        return "BREAKOUT"
    if rsi < 30 and direction == "long":
        return "OVERSOLD_REVERSAL"
    if rsi > 70 and direction == "short":
        return "OVERBOUGHT_REVERSAL"
    return "TREND_CONTINUATION"

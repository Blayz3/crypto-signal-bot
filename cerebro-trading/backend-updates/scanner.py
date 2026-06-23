"""Pipeline de escaneo v4 — sin blacklist, todos los pares aprenden.
Los modelos reciben contexto enriquecido por par y deciden por si mismos.
Semaforo(2): max 2 pares en paralelo para evitar cascada de rate-limits.
"""
from __future__ import annotations
import asyncio
import bybit_data
import indicators
import llm
from config import settings


async def scan() -> dict:
    symbols = bybit_data.top_symbols(settings.top_markets)

    # 1) Pre-filtro tecnico — sin blacklist, todos los pares se evaluan
    scored = []
    for sym in symbols:
        try:
            df = bybit_data.ohlcv(sym, settings.timeframe, limit=300)
            if len(df) < 210:
                continue
            df = indicators.enrich(df)
            feats = indicators.technical_score(df)
            scored.append((sym, feats))
        except Exception:
            continue

    scored.sort(key=lambda x: x[1]["score"], reverse=True)
    candidates = scored[: settings.llm_candidates]  # top 7 por score tecnico

    # 2) LLM con semaforo — max 2 pares simultaneos
    signals = []
    llm_used = settings.has_llm()

    if llm_used:
        sem = asyncio.Semaphore(2)

        async def analyze_limited(sym: str, feats: dict, idx: int) -> dict | None:
            async with sem:
                if idx > 0:
                    await asyncio.sleep(idx * 2)  # escalonar llamadas
                return await llm.analyze(sym, feats)

        results = await asyncio.gather(
            *(analyze_limited(sym, feats, i) for i, (sym, feats) in enumerate(candidates))
        )
        signals = [s for s in results if s]
    else:
        # Fallback sin LLM — solo indicadores tecnicos
        for sym, feats in candidates:
            if feats["score"] >= settings.min_confidence:
                atr   = feats["atr"]
                entry = feats["price"]
                if feats["direction"] == "long":
                    sl, tp = entry - 1.5 * atr, entry + 3.5 * atr
                else:
                    sl, tp = entry + 1.5 * atr, entry - 3.5 * atr
                signals.append({
                    "symbol":          sym,
                    "decision":        feats["direction"],
                    "confidence":      feats["score"],
                    "entry":           entry,
                    "stop_loss":       sl,
                    "take_profit":     tp,
                    "order_type":      "market",
                    "limit_price":     None,
                    "risk_reward":     round(abs(tp - entry) / abs(entry - sl), 2),
                    "technical_score": feats["score"],
                    "reasoning":       "Senal tecnica (sin LLM): " + "; ".join(feats["reasons"][:2]),
                    "reasons":         feats["reasons"],
                    "rsi":             feats["rsi"],
                    "atr_pct":         feats["atr_pct"],
                    "trend":           feats["trend"],
                    "timeframe":       settings.timeframe,
                })

    signals.sort(key=lambda s: s["confidence"], reverse=True)
    return {
        "scanned":    len(scored),
        "candidates": [{"symbol": s, "score": f["score"], "direction": f["direction"]}
                       for s, f in candidates],
        "signals":    signals,
        "llm_used":   llm_used,
    }

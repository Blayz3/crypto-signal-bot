'use strict';

/**
 * Capa de IA multi-proveedor (todos con API compatible con OpenAI).
 *
 * Cadena de proveedores GRATIS (config.ai.providers), en orden, saltando al
 * siguiente cuando uno se satura/cae (429/404/5xx) o le falta la key:
 *   1. Google Gemini  — ~1500 req/día gratis, sin tarjeta (recomendado).
 *   2. Groq           — Llama-3.3-70B / DeepSeek-R1, rapidísimo, límite generoso.
 *   3. OpenRouter     — modelos :free (solo 50 req/día → último recurso).
 *
 * Cada proveedor lee su key de process.env (api_key_env). Los que no tienen key
 * se omiten. Si una decisión agota toda la cadena, el scanner usa el plan
 * mecánico (grado C). Así el bot nunca se queda sin responder.
 */
class AIEngine {
  constructor(config, apiKey) {
    this.cfg = config.ai || {};

    let providers = this.cfg.providers;
    if (!providers || !providers.length) {
      // Compatibilidad con el esquema viejo (un solo OpenRouter).
      providers = [
        {
          name: 'openrouter',
          base_url: this.cfg.base_url || 'https://openrouter.ai/api/v1',
          api_key_env: 'OPENROUTER_API_KEY',
          decision_models: [this.cfg.decision_model, ...(this.cfg.decision_model_fallbacks || [])].filter(Boolean),
          vision_models: [this.cfg.vision_model, ...(this.cfg.vision_model_fallbacks || [])].filter(Boolean),
        },
      ];
    }

    // Resuelve la key de cada proveedor; conserva solo los que tienen key.
    this.providers = providers
      .map((p) => ({
        ...p,
        key: process.env[p.api_key_env] || (p.api_key_env === 'OPENROUTER_API_KEY' ? apiKey : '') || '',
      }))
      .filter((p) => p.key);

    if (!this.providers.length) {
      throw new Error(
        'Falta una API key de IA. Pon GEMINI_API_KEY (gratis, recomendada) — o GROQ_API_KEY / OPENROUTER_API_KEY — en .env / secrets.'
      );
    }
  }

  _decisionChain() {
    const chain = [];
    for (const p of this.providers) for (const m of p.decision_models || []) chain.push({ provider: p, model: m });
    return chain;
  }

  _visionChain() {
    const chain = [];
    for (const p of this.providers) for (const m of p.vision_models || []) chain.push({ provider: p, model: m });
    return chain;
  }

  async _chat(provider, model, messages, { temperature = 0.2, maxTokens = 900, jsonMode = false } = {}) {
    const body = { model, messages, temperature, max_tokens: maxTokens };
    // Salida JSON estricta donde se soporta (evita que los modelos "piensen en voz alta").
    if (jsonMode) body.response_format = { type: 'json_object' };
    const res = await fetch(`${provider.base_url}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${provider.key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://localhost/crypto-signal-bot',
        'X-Title': 'Crypto Signal Bot',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const txt = await res.text();
      const err = new Error(`${provider.name} ${res.status} (${model}): ${txt.slice(0, 200)}`);
      err.status = res.status;
      // Saturación (429), modelo retirado/inexistente (404), key del proveedor mala
      // (401/403) o caída (5xx) → se salta al siguiente modelo/proveedor de la cadena.
      // Solo 400 (payload malo) NO es reintentable (fallaría en todos por igual).
      err.retriable = [429, 404, 401, 403].includes(res.status) || res.status >= 500;
      throw err;
    }
    const json = await res.json();
    return json.choices?.[0]?.message?.content || '';
  }

  /**
   * Recorre la cadena [{provider, model}, ...]; salta al siguiente cuando el
   * error es reintentable. Devuelve { content, modelUsed }.
   */
  async _chatFallback(chain, messages, opts = {}) {
    let lastErr;
    for (const { provider, model } of chain) {
      try {
        const content = await this._chat(provider, model, messages, opts);
        return { content, modelUsed: `${provider.name}:${model}` };
      } catch (e) {
        lastErr = e;
        if (!e.retriable) throw e; // error real (payload) → no insistir
      }
    }
    throw new Error(
      `Todos los proveedores/modelos de IA fallaron (${chain.length} probados). ` +
        `Suelen estar saturados o sin cuota; reintenta o revisa las keys. ` +
        `Último error: ${lastErr ? lastErr.message : 'desconocido'}`
    );
  }

  /**
   * Pide una decisión de trade estructurada.
   * `candidate` trae symbol + indicadores por timeframe + bias local.
   * Devuelve objeto: { action, confidence, entry, stop, target, timeframe, style, rationale }
   */
  async decide(candidate, { brainContext = '', historyContext = '', marketContext = '', confluenceContext = '' } = {}) {
    const sys = `Eres un trader profesional de criptomonedas con CRITERIO PROPIO y un estandar de calidad extremo.
MISION: maximizar PROFIT en R, no el win rate. Metas del sistema: Profit Factor > 3 y +120R/mes.
Eso se logra con POCAS entradas A+ y ganadores que corren — JAMAS operando mas ni bajando la calidad.

FILTRO A+ (obligatorio; si falla UNA condicion, responde "none"):
1. Confluencia >= 3 factores independientes que TU valides (ideal 4+). Con 2 o menos: none.
2. R:R >= 2.0 al target conservador, y la estructura debe dejar espacio a 3R+ (sin nivel mayor estorbando). R:R < 2 = none.
3. Solo setups con expectativa positiva segun el cerebro/historial (momentum/continuacion, pullback a EMA en tendencia).
   Con setups debiles (retest, ruptura, rechazo-sr, rsi-reversion) exige confluencia 5+ o none.
4. A favor de la tendencia mayor (EMA200 del timeframe alto, ADX >= 25). Contra-tendencia SOLO con
   liquidity grab + nivel mayor (VAL/VAH/nPOC) + datos de mercado a favor (ballenas/funding).
5. Sin noticia de alto impacto inminente ni vela de noticias en curso.

GESTION (incluyela en el rationale de cada senal):
- Stop en la invalidacion estructural (~1.5-2x ATR). Nunca se aleja.
- Plan: a +1R mover stop a break-even; tomar parcial en 2R; dejar correr el resto con trailing
  por estructura hacia 3-6R. Perdida media < 1R y ganancia media >= 2.5R: de ahi sale el PF > 3.

DECISION:
- El sesgo local, los indicadores y los datos de mercado son SOLO entradas para tu juicio. Evalua AMBAS direcciones.
- Pondera ballenas, funding y sentimiento; si contradicen al tecnico, baja conviccion o none.
- Si hay historial, prioriza los setups que han ganado y evita los de expectativa negativa.
- "confidence" calibrada al conteo de confluencia VALIDADA: 3 factores = 55-65, 4 = 65-80, 5+ = 80-95.
  Nunca reportes confidence > 65 con menos de 4 factores validados.
- "orderType": "limit" cuando la mejor entrada es una zona a la que el precio debe volver (retest,
  demanda/oferta, tercer toque) con el precio en "entry"; "market" solo si esperar pierde el movimiento.
- "style": "scalp" (intradia) o "swing" (horas/dias) segun los timeframes dominantes.
- "setup": nombre exacto del setup del cerebro aplicado.
- En caso de duda: none. Decir none es gratis; un trade mediocre cuesta R y aleja la meta.
- CRITICO: NO razones en voz alta. NO escribas texto antes ni despues. Tu respuesta debe ser
  UNICAMENTE el objeto JSON, empezando por { y terminando en }.`;

    const schema = `{
  "action": "long" | "short" | "none",
  "confidence": 0-100,
  "style": "scalp" | "swing",
  "orderType": "limit" | "market",
  "timeframe": "el timeframe principal de la idea",
  "setup": "nombre del setup del cerebro aplicado, o '' si none",
  "entry": number,
  "stop": number,
  "target": number,
  "rationale": "2-3 frases en español explicando tu criterio, la confluencia y el setup"
}`;

    const visionBlock = candidate.visualReadings
      ? `\nLectura VISUAL del gráfico en TradingView (modelo de visión), por timeframe:\n${JSON.stringify(
          candidate.visualReadings,
          null,
          2
        )}\nIntegra esta lectura visual con los indicadores; si se contradicen, sé más conservador.\n`
      : '';

    const brainBlock = brainContext
      ? `\n===== CEREBRO (tu playbook — aplícalo) =====\n${brainContext}\n${
          historyContext ? historyContext + '\n' : ''
        }============================================\n`
      : '';

    const marketBlock = marketContext ? `\n${marketContext}\n` : '';
    const confluenceBlock = confluenceContext ? `\n${confluenceContext}\n` : '';

    const user = `Símbolo: ${candidate.symbol}
Precio actual: ${candidate.price}
Sesgo local (algoritmo): ${candidate.bias} (score ${candidate.score.toFixed(2)})

Indicadores por timeframe:
${JSON.stringify(candidate.byTimeframe, null, 2)}
${visionBlock}${marketBlock}${confluenceBlock}${brainBlock}
Devuelve la decisión en este formato JSON exacto:
${schema}`;

    const { content, modelUsed } = await this._chatFallback(
      this._decisionChain(),
      [
        { role: 'system', content: sys },
        { role: 'user', content: user },
      ],
      { jsonMode: true, maxTokens: 1500 }
    );

    const decision = this._parseJSON(content, candidate.symbol);
    decision.modelUsed = modelUsed;
    return decision;
  }

  /**
   * Fase 2 (opcional): describe un screenshot del gráfico con un modelo de visión.
   * imageDataUrl = "data:image/png;base64,...."
   */
  async describeChart(symbol, imageDataUrl, timeframe = '') {
    if (!this.cfg.use_vision) return null;
    const chain = this._visionChain();
    if (!chain.length) return null;
    const { content } = await this._chatFallback(
      chain,
      [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Eres analista técnico. Estás viendo el gráfico de ${symbol}${
                timeframe ? ` en temporalidad ${timeframe}` : ''
              } en TradingView. Describe en JSON la estructura: tendencia, soportes, resistencias, patrones de velas y de chart visibles. Solo JSON: {"trend","supports":[],"resistances":[],"patterns":[],"note"}`,
            },
            { type: 'image_url', image_url: { url: imageDataUrl } },
          ],
        },
      ],
      { maxTokens: 600 }
    );
    return this._parseJSON(content, symbol, true);
  }

  /** Análisis libre (no-JSON), p.ej. autopsia de un trade perdido. Devuelve texto. */
  async analyze(system, user, maxTokens = 400) {
    const { content } = await this._chatFallback(
      this._decisionChain(),
      [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      { maxTokens }
    );
    let text = (content || '').replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    // Algunos modelos "piensan en voz alta" antes de la respuesta final:
    // si el formato pedido (Causa:) aparece, quedarse con la ULTIMA ocurrencia.
    const last = text.lastIndexOf('Causa:');
    if (last > 0) text = text.slice(last);
    return text.trim();
  }

  _parseJSON(raw, symbol, soft = false) {
    // Quita bloques de razonamiento (<think>…</think>) y cercas de código.
    let clean = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/```(?:json)?/gi, '');
    // El JSON suele ser el último objeto balanceado; toma de la primera { a la última }.
    const first = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    const text = first !== -1 && lastBrace > first ? clean.slice(first, lastBrace + 1) : clean;
    try {
      return JSON.parse(text);
    } catch (e) {
      if (soft) return { _raw: raw };
      return {
        action: 'none',
        confidence: 0,
        symbol,
        rationale: `No se pudo parsear la respuesta de la IA: ${raw.slice(0, 160)}`,
      };
    }
  }
}

module.exports = { AIEngine };

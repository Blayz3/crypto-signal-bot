'use strict';

/**
 * Notificador de Telegram. Envía señales y resultados al chat del usuario.
 * Configura en .env: TELEGRAM_BOT_TOKEN (de @BotFather) y TELEGRAM_CHAT_ID.
 * Si faltan, queda como no-op (no rompe nada).
 */
class Telegram {
  constructor() {
    this.token = process.env.TELEGRAM_BOT_TOKEN || '';
    this.chatId = process.env.TELEGRAM_CHAT_ID || '';
    this.enabled = !!(this.token && this.chatId);
  }

  async send(text) {
    if (!this.enabled) return false;
    try {
      const res = await fetch(`https://api.telegram.org/bot${this.token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.chatId,
          text: String(text).slice(0, 4000),
          disable_web_page_preview: true,
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /** Formatea un TRADE (con grado de calidad) para Telegram. */
  formatTrade(e) {
    const arrow = e.dir === 'long' ? '🟢 LONG' : '🔴 SHORT';
    const ot = e.orderType === 'limit' ? 'LIMIT' : 'MARKET';
    const conf = e.confidence ? `${e.confidence}%` : '—';
    return (
      `📊 TRADE [${e.grade}] ${arrow} ${e.symbol} (${ot})\n` +
      `📥 Entrada: ${e.entry}\n🛑 SL: ${e.stop}\n🎯 TP: ${e.target}${e.rr ? `  (R:R ${e.rr})` : ''}\n` +
      `Confianza ${conf} · Confluencia ${e.confluence ?? '—'}${e.setup ? ` · ${e.setup}` : ''}` +
      (e.rationale ? `\n${e.rationale}` : '')
    );
  }

  /** Formatea una señal de trade para Telegram. */
  formatSignal(s) {
    const arrow = s.action === 'long' ? '🟢 LONG' : '🔴 SHORT';
    const ot = s.orderType === 'limit' ? 'LIMIT' : 'MARKET';
    return (
      `${arrow} ${s.symbol}  (${ot})\n` +
      `Entrada: ${s.entry}\nStop: ${s.stop}\nTarget: ${s.target}  (R:R ${s.rr})\n` +
      `Confianza: ${s.confidence}%  ·  Confluencia: ${s.confluence ?? '—'}  ·  ${s.setup || ''}\n` +
      `${s.rationale || ''}`
    );
  }
}

module.exports = { Telegram };

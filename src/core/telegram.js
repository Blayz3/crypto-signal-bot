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

  /** Formatea una IDEA graduada para el digest diario (A+/A/B con plan, C para vigilar). */
  formatIdea(e) {
    const dir = e.dir === 'long' ? '🟢 LONG' : e.dir === 'short' ? '🔴 SHORT' : '⚪';
    if (e.hasPlan) {
      return (
        `[${e.grade}] ${dir} ${e.symbol}\n` +
        `   entrada ${e.entry} · stop ${e.stop} · target ${e.target} (R:R ${e.rr})\n` +
        `   conf ${e.confidence}% · confluencia ${e.confluence} · ${e.setup || ''}`
      );
    }
    const vp = e.vp ? `\n   niveles: POC ${e.vp.poc} · VAL ${e.vp.val} · VAH ${e.vp.vah}` : '';
    return `[${e.grade}] ${dir} ${e.symbol} · vigilar (sin plan A+, confluencia ${e.confluence})${vp}`;
  }
}

module.exports = { Telegram };

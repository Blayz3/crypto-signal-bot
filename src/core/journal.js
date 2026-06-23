'use strict';

const fs = require('fs');
const path = require('path');
const { parseFrontmatter, expandHome, resolveVault } = require('./brain');

/**
 * Diario de operaciones dentro de la bóveda (carpeta diario/). Registra cada
 * señal como nota markdown y agrega estadísticas (WR, expectativa, racha) que
 * el bot puede inyectar en sus decisiones para aprender qué setups funcionan.
 *
 * Tú marcas el resultado de cada trade editando `status` y `result_r` en la
 * nota (o con `node scripts/journal-result.js`). Con esos datos el WR mejora.
 */
class Journal {
  constructor(config) {
    const bcfg = (config && config.brain) || {};
    const vault = resolveVault(bcfg.vault_path);
    this.dir = path.join(vault, 'diario');
    this.enabled = bcfg.enabled !== false && bcfg.journal !== false;
    this._monthlyGoal = bcfg.monthly_r_goal ?? 100;
  }

  _ensureDir() {
    if (!fs.existsSync(this.dir)) fs.mkdirSync(this.dir, { recursive: true });
  }

  /** Registra una señal nueva como nota de diario (status: open). */
  logSignal(signal) {
    if (!this.enabled) return null;
    this._ensureDir();
    const d = new Date(Date.now());
    const stamp = d.toISOString().slice(0, 16).replace(':', '');
    const symSafe = String(signal.symbol || 'NA').replace(/[^\w]/g, '');
    const file = path.join(this.dir, `${stamp}-${symSafe}-${signal.action}.md`);

    const fm = [
      '---',
      `title: ${signal.symbol} ${signal.action}`,
      'type: diario',
      `symbol: ${signal.symbol}`,
      `action: ${signal.action}`,
      `date: ${d.toISOString()}`,
      'status: open',
      `orderType: ${signal.orderType || 'market'}`,
      `setup: ${signal.setup || ''}`,
      `entry: ${signal.entry ?? ''}`,
      `stop: ${signal.stop ?? ''}`,
      `target: ${signal.target ?? ''}`,
      `rr: ${signal.rr ?? ''}`,
      `confidence: ${signal.confidence ?? ''}`,
      'result_r: ',
      '---',
      '',
      `# ${signal.symbol} ${String(signal.action).toUpperCase()} — ${d.toISOString().slice(0, 10)}`,
      '',
      `**Setup:** ${signal.setup || '—'}`,
      `**Estilo/TF:** ${signal.style || '—'} / ${signal.timeframe || '—'}`,
      `**Razón (IA):** ${signal.rationale || ''}`,
      '',
      '**Resultado:** (marca status: win/loss/breakeven y result_r al cerrar)',
      '**Lección:** ',
      '',
    ].join('\n');

    fs.writeFileSync(file, fm);
    return file;
  }

  /** Lee todas las entradas del diario parseadas. */
  readEntries() {
    if (!fs.existsSync(this.dir)) return [];
    return fs
      .readdirSync(this.dir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => {
        const raw = fs.readFileSync(path.join(this.dir, f), 'utf8');
        const fm = parseFrontmatter(raw) || {};
        return {
          file: f,
          symbol: fm.symbol,
          action: fm.action,
          status: (fm.status || 'open').trim(),
          setup: (fm.setup || '').trim(),
          date: fm.date,
          entry: parseFloat(fm.entry),
          stop: parseFloat(fm.stop),
          target: parseFloat(fm.target),
          rr: parseFloat(fm.rr),
          result_r: parseFloat(fm.result_r),
          confidence: parseFloat(fm.confidence),
        };
      });
  }

  /**
   * Estadísticas agregadas para aprendizaje:
   * WR global, expectativa en R, mejores/peores setups, racha y PnL del día.
   */
  stats() {
    const entries = this.readEntries();
    const closed = entries.filter(
      (e) => ['win', 'loss', 'breakeven'].includes(e.status) && !Number.isNaN(e.result_r)
    );

    const wins = closed.filter((e) => e.result_r > 0);
    const losses = closed.filter((e) => e.result_r < 0);
    const wr = closed.length ? wins.length / closed.length : null;
    const sumR = closed.reduce((a, e) => a + e.result_r, 0);
    const expectancy = closed.length ? sumR / closed.length : null;

    // Rendimiento por setup
    const bySetup = {};
    for (const e of closed) {
      const k = e.setup || 'sin-setup';
      (bySetup[k] = bySetup[k] || []).push(e.result_r);
    }
    const setupStats = Object.entries(bySetup).map(([setup, rs]) => ({
      setup,
      trades: rs.length,
      wr: rs.filter((r) => r > 0).length / rs.length,
      avgR: rs.reduce((a, r) => a + r, 0) / rs.length,
    }));

    // PnL y racha del día
    const today = new Date(Date.now()).toISOString().slice(0, 10);
    const month = today.slice(0, 7); // YYYY-MM
    const todays = closed.filter((e) => (e.date || '').slice(0, 10) === today);
    const todayR = todays.reduce((a, e) => a + e.result_r, 0);
    const monthR = closed
      .filter((e) => (e.date || '').slice(0, 7) === month)
      .reduce((a, e) => a + e.result_r, 0);
    const consecLosses = countTrailingLosses(closed);

    return {
      total: entries.length,
      closed: closed.length,
      open: entries.length - closed.length,
      wr,
      expectancy,
      sumR,
      setupStats: setupStats.sort((a, b) => b.avgR - a.avgR),
      todayR,
      monthR: Math.round(monthR * 10) / 10,
      consecLosses,
    };
  }

  /** Línea de progreso de la meta mensual (siempre disponible). */
  _metaLine(s) {
    const goal = this._monthlyGoal ?? 100;
    const d = new Date(Date.now());
    const daysInMonth = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
    const daysLeft = Math.max(1, daysInMonth - d.getUTCDate());
    const remaining = Math.max(0, goal - (s.monthR || 0));
    const pace = Math.round((remaining / daysLeft) * 10) / 10;
    return remaining <= 0
      ? `META MENSUAL: ${s.monthR}/${goal}R ✅ alcanzada. Protege ganancias, opera solo A+++.`
      : `META MENSUAL: ${s.monthR || 0}/${goal}R este mes. Faltan ${Math.round(remaining * 10) / 10}R en ${daysLeft} días (~${pace}R/día). Persíguela SOLO con setups A+ de alta confluencia; NO sobre-operes ni fuerces.`;
  }

  /** Bloque de texto con el historial para inyectar en la decisión. */
  statsContext() {
    const s = this.stats();
    if (!s.closed) {
      const base = s.total
        ? `HISTORIAL: ${s.total} señales registradas, ninguna cerrada aún (sin datos de WR todavía).`
        : 'HISTORIAL: aún sin trades cerrados.';
      return `${base}\n${this._metaLine(s)}`;
    }
    const lines = [];
    lines.push(
      `HISTORIAL (aprende de él): ${s.closed} trades cerrados, WR ${(s.wr * 100).toFixed(
        0
      )}%, expectativa ${fmtR(s.expectancy)} por trade.`
    );
    const best = s.setupStats.slice(0, 3).map((x) => `${x.setup} (${x.trades}t, WR ${(x.wr * 100).toFixed(0)}%, ${fmtR(x.avgR)})`);
    if (best.length) lines.push(`Por setup: ${best.join(' · ')}.`);
    // Aprende de los perdedores: avisa de los setups con expectativa negativa.
    const losers = s.setupStats.filter((x) => x.avgR < 0 && x.trades >= 2);
    if (losers.length) {
      const worst = losers
        .map((x) => `${x.setup} (${x.trades}t, ${fmtR(x.avgR)})`)
        .join(' · ');
      lines.push(`⚠️ SETUPS QUE PIERDEN (evítalos o exige más confluencia): ${worst}.`);
    }
    lines.push('Prioriza los setups que ganan; evita repetir los que pierden.');
    lines.push(this._metaLine(s));
    return lines.join('\n');
  }

  /** ¿Se alcanzó el límite de pérdida diaria? (para frenar nuevas señales) */
  dailyLimitHit(config) {
    const s = this.stats();
    const maxLossR = config?.brain?.daily_loss_limit_r ?? -3;
    const maxConsec = config?.brain?.max_consecutive_losses ?? 3;
    if (s.todayR <= maxLossR) return { hit: true, reason: `pérdida diaria ${fmtR(s.todayR)}` };
    if (s.consecLosses >= maxConsec)
      return { hit: true, reason: `${s.consecLosses} pérdidas seguidas` };
    return { hit: false };
  }
}

function countTrailingLosses(closed) {
  const sorted = [...closed].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  let n = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].result_r < 0) n++;
    else break;
  }
  return n;
}

function fmtR(r) {
  if (r == null || Number.isNaN(r)) return '—';
  return `${r >= 0 ? '+' : ''}${r.toFixed(2)}R`;
}

module.exports = { Journal };

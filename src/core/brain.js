'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

/**
 * El "cerebro": carga la bóveda Obsidian de conocimiento de trading, recupera
 * las notas relevantes a cada candidato y las formatea para inyectarlas en el
 * prompt de decisión de la IA. Así la IA opera con TU playbook, no improvisando.
 *
 * Sin dependencias de YAML: parsea el frontmatter de los campos que usamos.
 */
class Brain {
  constructor(config) {
    const bcfg = (config && config.brain) || {};
    this.enabled = bcfg.enabled !== false;
    this.vaultPath = resolveVault(bcfg.vault_path);
    this.topContext = bcfg.top_context_notes ?? 5;
    this.notes = [];
    this.loaded = false;
  }

  /** Carga y parsea todas las notas de conocimiento (excluye diario/templates). */
  load() {
    this.notes = [];
    if (!this.enabled || !fs.existsSync(this.vaultPath)) {
      this.loaded = true;
      return this;
    }
    const skipDirs = new Set(['diario', '_templates', '.obsidian']);
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name.startsWith('.')) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (!skipDirs.has(entry.name)) walk(full);
        } else if (entry.name.endsWith('.md') && entry.name !== 'README.md') {
          const note = this._parseNote(full);
          if (note) this.notes.push(note);
        }
      }
    };
    walk(this.vaultPath);
    this.loaded = true;
    return this;
  }

  _parseNote(file) {
    let raw;
    try {
      raw = fs.readFileSync(file, 'utf8');
    } catch {
      return null;
    }
    const fm = parseFrontmatter(raw);
    if (!fm) return null;
    const body = raw.replace(/^---[\s\S]*?---\n?/, '');
    const ruleMatch = body.match(/\*\*Regla para el bot:\*\*\s*(.+)/);
    return {
      file,
      title: fm.title || path.basename(file, '.md'),
      type: (fm.type || '').trim(),
      tags: toArray(fm.tags),
      bias: toArray(fm.bias),
      regime: toArray(fm.regime),
      timeframe: toArray(fm.timeframe),
      weight: (fm.weight || 'medium').trim(),
      rule: ruleMatch ? ruleMatch[1].trim() : firstParagraph(body),
      playbook: extractPlaybook(body),
    };
  }

  /**
   * Recupera notas relevantes a un candidato y devuelve un bloque de texto para
   * el prompt. `ctx` = { bias, regime, timeframe }.
   * Siempre incluye principios + gestión de riesgo (risk-first); el resto se
   * rellena con las notas de setups/patrones/estructura mejor puntuadas.
   */
  contextFor(ctx = {}) {
    if (!this.loaded) this.load();
    if (!this.notes.length) return '';

    const core = this.notes.filter((n) => n.type === 'riesgo' || n.type === 'principio');
    const rest = this.notes.filter((n) => n.type !== 'riesgo' && n.type !== 'principio');

    const scored = rest
      .map((n) => ({ n, s: this._score(n, ctx) }))
      .sort((a, b) => b.s - a.s)
      .slice(0, this.topContext)
      .map((x) => x.n);

    const fmt = (n) => `- [${n.title}] ${n.rule}`;
    const lines = [];
    lines.push('PRINCIPIOS Y RIESGO (aplican siempre):');
    for (const n of core) lines.push(fmt(n));
    if (scored.length) {
      lines.push('');
      lines.push('CONOCIMIENTO RELEVANTE A ESTE SETUP:');
      for (const n of scored) lines.push(fmt(n));
    }
    const withPb = scored.filter((n) => n.playbook).slice(0, 3);
    if (withPb.length) {
      lines.push('');
      lines.push('PLAYBOOKS DE EJECUCION (siguelos paso a paso; si el candidato no cumple un paso, none):');
      for (const n of withPb) {
        lines.push('');
        lines.push('### ' + n.title);
        lines.push(n.playbook);
      }
    }
    return lines.join('\n');
  }

  _score(note, ctx) {
    let s = 0;
    const w = { high: 2, medium: 1, low: 0 }[note.weight] ?? 1;
    s += w;
    if (ctx.bias && note.bias.includes(ctx.bias)) s += 2;
    if (ctx.regime) {
      if (note.regime.includes(ctx.regime)) s += 2;
      else if (note.regime.includes('any')) s += 0.5;
    }
    if (ctx.timeframe && (note.timeframe.includes(ctx.timeframe) || note.timeframe.includes('any')))
      s += 0.5;
    return s;
  }

  /** Lista de títulos cargados (para depurar/mostrar en UI). */
  summary() {
    if (!this.loaded) this.load();
    return { count: this.notes.length, vault: this.vaultPath, titles: this.notes.map((n) => n.title) };
  }
}

/**
 * Deriva el régimen de mercado (trending/ranging) a partir de los indicadores
 * del candidato, usando el timeframe mayor disponible.
 */
function regimeFromCandidate(candidate) {
  const byTf = candidate.byTimeframe || {};
  const tfs = Object.keys(byTf);
  if (!tfs.length) return 'any';
  const tf = tfs[tfs.length - 1]; // el último suele ser el mayor
  const ind = byTf[tf];
  if (!ind) return 'any';
  const adx = ind.adx || 0;
  const aligned =
    (ind.ema20 > ind.ema50 && ind.ema50 > ind.ema200) ||
    (ind.ema20 < ind.ema50 && ind.ema50 < ind.ema200);
  if (adx > 25 && aligned) return 'trending';
  if (adx < 20) return 'ranging';
  return 'any';
}

// --- helpers ---

function expandHome(p) {
  if (p.startsWith('~')) return path.join(os.homedir(), p.slice(1));
  return p;
}

/**
 * Resuelve la ruta de la bóveda: usa la configurada; si no existe (p.ej. en un
 * servidor), cae al cerebro EMPAQUETADO con el proyecto (`<proyecto>/cerebro-trading`).
 */
function resolveVault(configured) {
  const p = expandHome(configured || '~/Desktop/cerebro-trading');
  try {
    if (fs.existsSync(p)) return p;
  } catch {
    /* ignore */
  }
  const bundled = path.join(__dirname, '../../cerebro-trading');
  return fs.existsSync(bundled) ? bundled : p;
}

function parseFrontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const out = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (kv) out[kv[1]] = kv[2];
  }
  return out;
}

function toArray(val) {
  if (!val) return [];
  let s = String(val).trim();
  s = s.replace(/^\[/, '').replace(/\]$/, '');
  return s
    .split(',')
    .map((x) => x.trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean);
}

function extractPlaybook(body) {
  const m = body.match(/## Playbook[^\n]*\n([\s\S]*?)(?=\n## |\n\*\*Regla para el bot|$)/);
  return m ? m[1].trim() : '';
}
function firstParagraph(body) {
  const text = body.replace(/^#.*$/m, '').trim();
  const para = text.split('\n\n')[0] || '';
  return para.replace(/\n/g, ' ').slice(0, 200);
}

module.exports = { Brain, regimeFromCandidate, parseFrontmatter, toArray, expandHome, resolveVault };

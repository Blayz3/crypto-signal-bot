'use strict';

const scanBtn = document.getElementById('scanBtn');
const visualBtn = document.getElementById('visualBtn');
const autoscan = document.getElementById('autoscan');
const statusEl = document.getElementById('status');
const metaEl = document.getElementById('meta');
const signalsEl = document.getElementById('signals');
const emptyEl = document.getElementById('empty');

scanBtn.addEventListener('click', () => window.api.runScan());
visualBtn.addEventListener('click', () => {
  statusEl.textContent = 'El bot va a controlar TradingView. No toques el teclado…';
  window.api.runVisualScan();
});
autoscan.addEventListener('change', (e) => window.api.toggleAutoscan(e.target.checked));

window.api.onStatus(({ running }) => {
  scanBtn.disabled = running;
  visualBtn.disabled = running;
  scanBtn.textContent = running ? 'Escaneando…' : 'Escanear ahora';
});

window.api.onProgress(({ stage, info }) => {
  const map = {
    resolving: 'Resolviendo lista de monedas…',
    symbols: `Escaneando ${info.count} monedas…`,
    indicators: `Indicadores: ${info.symbol} (${info.i}/${info.total})`,
    candidates: `${info.count} pasan a la siguiente etapa…`,
    'tv-symbol': `TradingView → ${info.symbol} (${info.i}/${info.total})`,
    'tv-capture': `Capturando ${info.symbol} en ${info.tf}…`,
    ai: `IA analizando ${info.symbol} (${info.i}/${info.total})`,
    done: 'Escaneo completo.',
  };
  if (map[stage]) statusEl.textContent = map[stage];
});

window.api.onError(({ message }) => {
  statusEl.textContent = `Error: ${message}`;
});

window.api.onResult((res) => {
  if (res.halted) {
    statusEl.textContent = `⛔ Operativa detenida: ${res.halted}. El cerebro frenó nuevas señales.`;
  }
  const second =
    res.visited != null ? `${res.visited} en TradingView` : `${res.candidates} a IA`;
  metaEl.textContent = `${res.scanned} analizadas · ${second} · ${res.signals.length} señales`;
  render(res.signals);
});

function render(signals) {
  signalsEl.innerHTML = '';
  emptyEl.style.display = signals.length ? 'none' : 'block';
  if (!signals.length) {
    emptyEl.textContent = 'Sin señales de alta probabilidad en este escaneo. Prueba más tarde.';
    return;
  }
  for (const s of signals) {
    signalsEl.appendChild(card(s));
  }
}

function card(s) {
  const el = document.createElement('div');
  el.className = `card ${s.action}`;
  el.innerHTML = `
    <div class="card-head">
      <span class="sym">${s.symbol}</span>
      <span class="badge ${s.action}">${s.action}</span>
    </div>
    <div class="levels">
      <div class="level"><small>Entrada</small><b>${fmt(s.entry)}</b></div>
      <div class="level"><small>Stop</small><b>${fmt(s.stop)}</b></div>
      <div class="level"><small>Target</small><b>${fmt(s.target)}</b></div>
      <div class="level"><small>R:R</small><b>${s.rr ?? '—'}</b></div>
      <div class="level">
        <small>Confianza ${s.confidence}%</small>
        <div class="conf-bar"><div class="conf-fill" style="width:${s.confidence}%"></div></div>
      </div>
    </div>
    <p class="rationale">${escapeHtml(s.rationale || '')}</p>
    <div class="card-foot">
      <div class="meta-tags">
        <span class="tag">${s.style || '—'}</span>
        <span class="tag">${s.timeframe || '—'}</span>
        ${s.setup ? `<span class="tag">🧠 ${escapeHtml(s.setup)}</span>` : ''}
        ${s.regime ? `<span class="tag">${s.regime}</span>` : ''}
        <span class="tag">score ${s.localScore ?? '—'}</span>
      </div>
      <span class="link" data-sym="${s.symbol}">Abrir en TradingView ↗</span>
    </div>
  `;
  el.querySelector('.link').addEventListener('click', () =>
    window.api.openTradingView(s.symbol)
  );
  return el;
}

function fmt(n) {
  if (n == null) return '—';
  return Number(n).toLocaleString('es', { maximumFractionDigits: 8 });
}
function escapeHtml(str) {
  return str.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

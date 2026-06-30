'use strict';

/**
 * Cuenta de PAPER TRADING. Lee todos los trades del bot (ideas-log) y arma el
 * estado de la cuenta para la app:
 *   - Posiciones ABIERTAS (con P&L no realizado al precio en vivo).
 *   - Trades CERRADOS (P&L realizado).
 *   - Curva de equity (dinero ganado/perdido acumulado).
 *
 * Reglas (config.paper):
 *   - Margen FIJO por trade: $200.
 *   - Apalancamiento: 20x si el precio de entrada < $20, 40x si >= $20.
 *   - Nocional = margen × apalancamiento.  P&L = nocional × variación% × dirección.
 *   - Pérdida tope = el margen (liquidación de margen aislado).
 *
 * Escribe cerebro-trading/paper-account.json (lo consume la app Swift en tiempo real).
 * Uso: node scripts/paper-account.js
 */

const path = require('path');
const fs = require('fs');
const { Journal } = require('../src/core/journal');
const { resolveVault } = require('../src/core/brain');

function loadConfig() {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '../config.json'), 'utf8'));
}
const r2 = (x) => (x == null || Number.isNaN(x) ? null : Math.round(x * 100) / 100);

(async () => {
  const config = loadConfig();
  const p = config.paper || {};
  const MARGIN = p.margin_per_trade || 200;
  const START = p.starting_balance || 1000;
  const LEV_LOW = p.leverage_low || 20;
  const LEV_HIGH = p.leverage_high || 40;
  const THRESH = p.leverage_price_threshold || 20;

  const leverageFor = (entry) => (entry < THRESH ? LEV_LOW : LEV_HIGH);
  // P&L en $ de una posición dada un precio de salida (capado a -margen).
  const pnlAt = (pos, exit) => {
    const dirSign = pos.dir === 'long' ? 1 : -1;
    const raw = pos.notional * ((exit - pos.entry) / pos.entry) * dirSign;
    return Math.max(-MARGIN, raw);
  };
  const mkPos = (it) => {
    const lev = leverageFor(it.entry);
    const notional = MARGIN * lev;
    return {
      id: it.id,
      symbol: it.symbol,
      dir: it.dir,
      grade: it.grade || '',
      entry: it.entry,
      stop: it.stop,
      target: it.target,
      leverage: lev,
      margin: MARGIN,
      notional,
      qty: r2(notional / it.entry),
      openedAt: it.date,
    };
  };

  const journal = new Journal(config);
  const ideas = journal.readIdeas().filter((x) => Number.isFinite(x.entry));

  const openRaw = ideas.filter((x) => x.status === 'open');
  const closedRaw = ideas.filter((x) => ['win', 'loss', 'breakeven'].includes(x.status));

  // --- Precios en vivo para las posiciones abiertas (snapshot; la app refresca) ---
  const marks = {};
  if (openRaw.length) {
    try {
      const ex = require('../src/core/data-exchange').spotClient();
      const syms = [...new Set(openRaw.map((x) => x.symbol))];
      const tickers = await ex.fetchTickers(syms).catch(() => ({}));
      for (const s of syms) marks[s] = tickers[s]?.last ?? null;
      // Para los que falten, intenta uno a uno.
      for (const s of syms) {
        if (marks[s] == null) {
          try { marks[s] = (await ex.fetchTicker(s)).last; } catch { /* sin precio */ }
        }
      }
    } catch { /* sin exchange → la app pondrá los precios en vivo */ }
  }

  // --- Posiciones abiertas con P&L no realizado ---
  const open = openRaw.map((it) => {
    const pos = mkPos(it);
    const mark = marks[it.symbol] ?? null;
    const uPnl = mark != null ? r2(pnlAt(pos, mark)) : null;
    return {
      ...pos,
      markPrice: mark,
      unrealizedPnl: uPnl,
      unrealizedPct: uPnl != null ? r2((uPnl / MARGIN) * 100) : null,
    };
  });

  // --- Trades cerrados con P&L realizado ---
  const closed = closedRaw
    .map((it) => {
      const pos = mkPos(it);
      // exit guardado por el monitor; si no, se aproxima por el resultado.
      const exit =
        it.exit != null ? it.exit : it.status === 'win' ? it.target : it.status === 'loss' ? it.stop : it.entry;
      const pnl = r2(pnlAt(pos, exit));
      return {
        ...pos,
        exit,
        status: it.status,
        resultR: it.result_r ?? null,
        pnl,
        pnlPct: r2((pnl / MARGIN) * 100),
        closedAt: it.closedAt || it.date,
      };
    })
    .sort((a, b) => String(a.closedAt).localeCompare(String(b.closedAt)));

  // --- Curva de equity (balance acumulado partiendo de START) ---
  let bal = START;
  const equity = [{ t: closed[0]?.openedAt || new Date(Date.now()).toISOString(), balance: START }];
  for (const c of closed) {
    bal = r2(bal + c.pnl);
    equity.push({ t: c.closedAt, balance: bal });
  }

  const realizedPnl = r2(closed.reduce((a, c) => a + c.pnl, 0));
  const openUnrealized = r2(open.reduce((a, o) => a + (o.unrealizedPnl || 0), 0));
  const wins = closed.filter((c) => c.pnl > 0).length;
  const losses = closed.filter((c) => c.pnl < 0).length;

  const account = {
    updated: new Date(Date.now()).toISOString(),
    marginPerTrade: MARGIN,
    startingBalance: START,
    leverageRule: { threshold: THRESH, below: LEV_LOW, atOrAbove: LEV_HIGH },
    balance: r2(START + realizedPnl),
    equity: r2(START + realizedPnl + openUnrealized),
    realizedPnl,
    unrealizedPnl: openUnrealized,
    stats: {
      openCount: open.length,
      closedCount: closed.length,
      wins,
      losses,
      winRate: closed.length ? r2((wins / closed.length) * 100) : null,
    },
    open,
    closed,
    equityCurve: equity,
  };

  const vault = resolveVault(config.brain?.vault_path);
  const out = path.join(vault, 'paper-account.json');
  fs.writeFileSync(out, JSON.stringify(account, null, 2));
  console.log(
    `Cuenta paper: balance $${account.balance} | equity $${account.equity} | abiertas ${open.length} | cerradas ${closed.length} (${wins}W/${losses}L) | realizado ${realizedPnl >= 0 ? '+' : ''}$${realizedPnl}`
  );
})().catch((e) => {
  console.error('paper-account error:', e.message);
  process.exit(1);
});

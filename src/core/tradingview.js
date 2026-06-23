'use strict';

const { execFile } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const os = require('os');
const path = require('path');

const execFileP = promisify(execFile);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Controla la app NATIVA de TradingView en macOS mediante:
 *  - osascript (AppleScript / System Events) para activar la app y enviar teclado.
 *  - screencapture para capturar la ventana.
 *
 * Estrategia de teclado (más robusta que clicar píxeles):
 *  - Cambiar de símbolo: TradingView abre el buscador al teclear letras -> tecleamos
 *    el símbolo y Enter.
 *  - Cambiar de temporalidad: teclear el número del intervalo (15, 60, 240, 1D) + Enter.
 *
 * Requiere permiso de Accesibilidad para el proceso que ejecuta esto
 * (Terminal o la app Electron): Ajustes > Privacidad > Accesibilidad.
 */
class TradingViewController {
  constructor(config) {
    const tv = (config && config.tradingview) || {};
    this.appName = tv.app_name || 'TradingView';
    this.delays = {
      afterActivate: tv.delay_activate_ms ?? 800,
      afterSymbol: tv.delay_symbol_ms ?? 2500,
      afterTimeframe: tv.delay_timeframe_ms ?? 2000,
      beforeCapture: tv.delay_capture_ms ?? 600,
      perKeystroke: tv.delay_keystroke_ms ?? 30,
    };
    // Mapa timeframe -> teclas que entiende TradingView.
    this.tfKeys = tv.timeframe_keys || {
      '1m': '1',
      '3m': '3',
      '5m': '5',
      '15m': '15',
      '30m': '30',
      '1h': '60',
      '2h': '120',
      '4h': '240',
      '1d': '1D',
      '1w': '1W',
    };
    this.tmpDir = tv.capture_dir || path.join(os.tmpdir(), 'csb-captures');
    if (!fs.existsSync(this.tmpDir)) fs.mkdirSync(this.tmpDir, { recursive: true });
  }

  async _osa(script) {
    const { stdout } = await execFileP('osascript', ['-e', script]);
    return stdout.trim();
  }

  /** ¿Está instalada/accesible la app? */
  async isAvailable() {
    try {
      await this._osa(`tell application "System Events" to (name of processes)`);
      return true;
    } catch {
      return false;
    }
  }

  /** Trae TradingView al frente. */
  async activate() {
    await this._osa(`tell application "${this.appName}" to activate`);
    await sleep(this.delays.afterActivate);
  }

  /** Cierra cualquier diálogo abierto. */
  async escape() {
    await this._osa(`tell application "System Events" to key code 53`); // Esc
    await sleep(150);
  }

  /** Teclea un texto carácter a carácter (más fiable en TradingView). */
  async _type(text) {
    // Escapamos comillas y backslashes para AppleScript.
    const safe = text.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    await this._osa(
      `tell application "System Events" to keystroke "${safe}"`
    );
  }

  async _enter() {
    await this._osa(`tell application "System Events" to key code 36`); // Return
  }

  /**
   * Cambia el símbolo del gráfico. Acepta "BTC/USDT" o "BTCUSDT".
   * Al teclear letras, TradingView abre el buscador de símbolos.
   */
  async setSymbol(symbol) {
    const clean = symbol.replace('/', '').toUpperCase();
    await this.escape();
    await this._type(clean);
    await sleep(700); // deja que aparezcan los resultados
    await this._enter();
    await sleep(this.delays.afterSymbol);
  }

  /** Cambia la temporalidad usando el atajo numérico de TradingView. */
  async setTimeframe(tf) {
    const keys = this.tfKeys[tf];
    if (!keys) throw new Error(`Timeframe sin mapeo de teclas: ${tf}`);
    await this.escape();
    await this._type(keys);
    await sleep(300);
    await this._enter();
    await sleep(this.delays.afterTimeframe);
  }

  /** Devuelve los límites {x,y,w,h} de la ventana frontal de la app, o null. */
  async _frontWindowBounds() {
    try {
      const out = await this._osa(
        `tell application "System Events" to tell process "${this.appName}"\n` +
          `set p to position of front window\n` +
          `set s to size of front window\n` +
          `return (item 1 of p as text) & "," & (item 2 of p as text) & "," & (item 1 of s as text) & "," & (item 2 of s as text)\n` +
          `end tell`
      );
      const [x, y, w, h] = out.split(',').map((n) => parseInt(n.trim(), 10));
      if ([x, y, w, h].some((n) => Number.isNaN(n))) return null;
      return { x, y, w, h };
    } catch {
      return null;
    }
  }

  /**
   * Captura la ventana de TradingView a PNG y devuelve { file, dataUrl }.
   * Usa los límites de la ventana si los obtiene; si no, toda la pantalla.
   */
  async capture(label = 'chart') {
    await sleep(this.delays.beforeCapture);
    const file = path.join(this.tmpDir, `${label}.png`.replace(/[^\w.\-]/g, '_'));
    const bounds = await this._frontWindowBounds();
    const args = ['-x', '-o'];
    if (bounds && bounds.w > 100 && bounds.h > 100) {
      args.push('-R', `${bounds.x},${bounds.y},${bounds.w},${bounds.h}`);
    }
    args.push(file);
    await execFileP('screencapture', args);
    const b64 = fs.readFileSync(file).toString('base64');
    return { file, dataUrl: `data:image/png;base64,${b64}` };
  }
}

module.exports = { TradingViewController, sleep };

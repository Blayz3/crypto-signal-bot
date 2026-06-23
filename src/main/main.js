'use strict';

const { app, BrowserWindow, ipcMain, Notification, shell } = require('electron');
const path = require('path');
const { runScan, loadConfig } = require('../core/scanner');
const { runVisualScan } = require('../core/visual_scanner');

let win;
let scanTimer = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1040,
    height: 760,
    title: 'Crypto Signal Bot',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile(path.join(__dirname, '../renderer/index.html'));
}

function notify(signal) {
  if (!Notification.isSupported()) return;
  const n = new Notification({
    title: `${signal.action.toUpperCase()} ${signal.symbol} · ${signal.confidence}%`,
    body: `Entrada ${signal.entry} | Stop ${signal.stop} | Target ${signal.target} (R:R ${signal.rr})\n${signal.rationale}`,
    silent: false,
  });
  n.show();
}

async function doScan(mode = 'fast') {
  const config = loadConfig();
  win?.webContents.send('scan:status', { running: true, mode });
  try {
    const onProgress = (stage, info) =>
      win?.webContents.send('scan:progress', { stage, info });
    const res =
      mode === 'visual'
        ? await runVisualScan(config, { onProgress })
        : await runScan(config, { onProgress });
    win?.webContents.send('scan:result', res);

    const minConf = config.notify.min_confidence ?? 0;
    if (config.notify.macos_notification) {
      for (const s of res.signals) {
        if ((s.confidence || 0) >= minConf) notify(s);
      }
    }
  } catch (e) {
    win?.webContents.send('scan:error', { message: e.message });
  } finally {
    win?.webContents.send('scan:status', { running: false });
  }
}

ipcMain.handle('scan:run', async () => {
  await doScan('fast');
  return true;
});

ipcMain.handle('scan:runVisual', async () => {
  await doScan('visual');
  return true;
});

ipcMain.handle('config:get', async () => loadConfig());

ipcMain.handle('autoscan:toggle', async (_e, enabled) => {
  if (scanTimer) {
    clearInterval(scanTimer);
    scanTimer = null;
  }
  if (enabled) {
    const config = loadConfig();
    const ms = (config.scan_interval_minutes || 15) * 60 * 1000;
    scanTimer = setInterval(doScan, ms);
    doScan();
  }
  return enabled;
});

// Abre el gráfico en TradingView para revisar la señal manualmente.
ipcMain.handle('open:tradingview', async (_e, symbol) => {
  const tv = symbol.replace('/', '');
  const url = `https://www.tradingview.com/chart/?symbol=BINANCE:${tv}`;
  await shell.openExternal(url);
  return true;
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

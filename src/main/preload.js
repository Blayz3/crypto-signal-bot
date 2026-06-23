'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  runScan: () => ipcRenderer.invoke('scan:run'),
  runVisualScan: () => ipcRenderer.invoke('scan:runVisual'),
  getConfig: () => ipcRenderer.invoke('config:get'),
  toggleAutoscan: (enabled) => ipcRenderer.invoke('autoscan:toggle', enabled),
  openTradingView: (symbol) => ipcRenderer.invoke('open:tradingview', symbol),
  onProgress: (cb) => ipcRenderer.on('scan:progress', (_e, d) => cb(d)),
  onResult: (cb) => ipcRenderer.on('scan:result', (_e, d) => cb(d)),
  onStatus: (cb) => ipcRenderer.on('scan:status', (_e, d) => cb(d)),
  onError: (cb) => ipcRenderer.on('scan:error', (_e, d) => cb(d)),
});

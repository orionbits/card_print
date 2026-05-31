const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getMachineId: () => ipcRenderer.invoke('get-machine-id'),
  checkLicense: () => ipcRenderer.invoke('check-license'),
  getRawHardwareInfo: () => ipcRenderer.invoke('get-raw-hw-info'),
  scanImage: (dpi) => ipcRenderer.invoke('scan-image', dpi),
  printPage: (options) => ipcRenderer.invoke('print-page', options),
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  copyToClipboard: (text) => ipcRenderer.invoke('copy-to-clipboard', text)
});

window.addEventListener('DOMContentLoaded', () => {
  console.log("AM Comp: Ready");
});
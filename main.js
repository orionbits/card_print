import { app, BrowserWindow, Menu, ipcMain, dialog, clipboard } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = false; // Force production mode since we don't have dev server

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false
    },
    icon: path.join(__dirname, 'dist/web', 'favicon.ico'),
    title: 'AM Comp'
  });

  Menu.setApplicationMenu(null);

  // Enable F12 to open DevTools even in production
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' && input.type === 'keyDown') {
      mainWindow.webContents.toggleDevTools();
    }
  });

  // Always load the production build
  const indexPath = path.join(__dirname, 'dist/web', 'index.html');
  console.log('Loading index from:', indexPath);
  
  if (fs.existsSync(indexPath)) {
    mainWindow.loadFile(indexPath);
    console.log('Successfully loaded index.html');
  } else {
    console.error('ERROR: index.html not found at:', indexPath);
    // Fallback - show error message
    mainWindow.loadURL(`data:text/html;charset=utf-8,
      <html><body style="background:#1a1a2e;color:white;display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;">
      <div style="text-align:center">
        <h1>AM Comp</h1>
        <p>Error: Could not load the application.</p>
        <p>Please make sure the dist/web folder contains the frontend files.</p>
      </div>
      </body></html>`);
  }
}

// Simple machine ID (no licensing)
function generateSimpleMachineId() {
  try {
    const simpleId = os.hostname().toUpperCase().substring(0, 16);
    return simpleId || 'AMCOMP-DESKTOP';
  } catch (e) {
    return 'AMCOMP-DESKTOP';
  }
}

ipcMain.handle('get-machine-id', async () => {
  const idFile = path.join(app.getPath('userData'), 'am_comp_id.txt');
  
  try {
    if (fs.existsSync(idFile)) {
      const content = fs.readFileSync(idFile, 'utf8').trim();
      if (content && content.length >= 4) return content;
    }
    
    const simpleId = generateSimpleMachineId();
    fs.writeFileSync(idFile, simpleId, 'utf8');
    return simpleId;
  } catch (e) {
    return 'AMCOMP-DESKTOP';
  }
});

ipcMain.handle('check-license', async () => {
  return { valid: true, message: 'Open Source Edition' };
});

ipcMain.handle('get-raw-hw-info', async () => {
  return {
    uuid: 'OPEN_SOURCE_EDITION',
    cpu: 'OPEN_SOURCE_EDITION',
    disk: 'OPEN_SOURCE_EDITION'
  };
});

ipcMain.handle('copy-to-clipboard', async (event, text) => {
  clipboard.writeText(text);
  return true;
});

ipcMain.handle('scan-image', async (event, dpi = 300) => {
  if (mainWindow) {
    mainWindow.focus();
  }
  
  const tempPath = path.join(app.getPath('temp'), `scan_${Date.now()}.png`);
  const scriptPath = path.join(app.getPath('temp'), `scan_script_${Date.now()}.ps1`);
  
  const psScript = `
$ErrorActionPreference = 'Stop'
try {
  $manager = New-Object -ComObject WIA.DeviceManager
  if ($manager.DeviceInfos.Count -eq 0) { throw "No scanner found" }
  
  $device = $manager.DeviceInfos.Item(1).Connect()
  $item = $device.Items.Item(1)
  
  foreach($prop in $item.Properties) {
    if ($prop.PropertyID -eq 6147) { $prop.Value = ${dpi} }
    if ($prop.PropertyID -eq 6148) { $prop.Value = ${dpi} }
    if ($prop.PropertyID -eq 6146) { $prop.Value = 1 }
  }

  $dialog = New-Object -ComObject WIA.CommonDialog
  $image = $item.Transfer("{B96B3CAF-0728-11D3-9D7B-0000F81EF32E}")
  
  if ($null -eq $image) { exit 0 } 
  
  if (Test-Path "${tempPath.replace(/\\/g, '\\\\')}") { Remove-Item "${tempPath.replace(/\\/g, '\\\\')}" }
  $image.SaveFile("${tempPath.replace(/\\/g, '\\\\')}")
  Write-Output "SUCCESS"
} catch {
  $errMsg = $_.Exception.Message
  if ($errMsg -match "cancel" -or $errMsg -match "0x80210064") { exit 0 }
  [Console]::Error.WriteLine($errMsg)
  exit 1
}
`;

  try {
    fs.writeFileSync(scriptPath, psScript, 'utf8');
    
    const { stdout, stderr } = await execAsync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}"`);
    
    if (fs.existsSync(scriptPath)) fs.unlinkSync(scriptPath);
    
    if (fs.existsSync(tempPath)) {
      const base64 = fs.readFileSync(tempPath, { encoding: 'base64' });
      fs.unlinkSync(tempPath);
      return `data:image/png;base64,${base64}`;
    } else {
      return null;
    }
  } catch (err) {
    if (fs.existsSync(scriptPath)) fs.unlinkSync(scriptPath);
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    
    if (err.code === 0) return null;
    
    const errorMsg = (err.stderr || err.message).toString();
    if (errorMsg.includes('0x8021') || errorMsg.includes('WIA') || errorMsg.includes('HRESULT')) {
      throw new Error("Scanner not found. Please connect a scanner and try again!");
    }
    throw new Error("Scanner Error: Please check scanner connection.");
  }
});

ipcMain.handle('print-page', async (event, options) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  return new Promise((resolve) => {
    win.webContents.print({
      silent: options?.silent || false,
      printBackground: true,
      margins: { marginType: 'none' },
      scaleFactor: 100,
      deviceName: options?.deviceName || undefined
    }, (success, errorType) => {
      if (!success) {
        console.error('Print failed:', errorType);
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
});

ipcMain.handle('get-printers', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  return await win.webContents.getPrintersAsync();
});

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => { 
  if (process.platform !== 'darwin') app.quit(); 
});

app.on('activate', () => { 
  if (BrowserWindow.getAllWindows().length === 0) createWindow(); 
});
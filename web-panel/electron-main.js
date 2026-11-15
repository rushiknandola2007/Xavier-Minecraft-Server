const { app, BrowserWindow, shell, dialog } = require('electron');
const path = require('path');
const http = require('http');
require('dotenv').config();

const PORT = parseInt(process.env.PORT, 10) || 3000;

// Single-instance lock: a second launch focuses the existing window instead of
// crashing with EADDRINUSE on the internal HTTP/WebSocket port.
const gotLock = app.requestSingleInstanceLock();
app.disableHardwareAcceleration();

let panelServer = null;
const gitSync = require('./git-sync');

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

let mainWindow = null;
let isQuitting = false;

function waitForServer(url, timeoutMs = 15000) {
  const startTime = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      http.get(url, (res) => {
        resolve();
      }).on('error', () => {
        if (Date.now() - startTime > timeoutMs) {
          reject(new Error('Server start timed out'));
        } else {
          setTimeout(check, 250);
        }
      });
    };
    check();
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 860,
    minHeight: 560,
    center: true,
    title: 'Minecraft Server Manager',
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    backgroundColor: '#0a0c10',
    autoHideMenuBar: true,
    show: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const serverUrl = `http://127.0.0.1:${PORT}`;

  const revealWindow = () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.moveTop();
    mainWindow.focus();
  };

  mainWindow.webContents.on('did-finish-load', revealWindow);
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error(`Panel load failed (${errorCode}: ${errorDescription}) for ${validatedURL}`);
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.loadURL(serverUrl).catch(() => {});
      }
    }, 500);
  });

  try {
    await waitForServer(serverUrl);
    await mainWindow.loadURL(serverUrl);
  } catch (err) {
    console.error('Failed to connect to internal server:', err);
    await mainWindow.loadURL(serverUrl);
  }

  revealWindow();
  mainWindow.once('ready-to-show', revealWindow);

  // Open external links in user's default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Safe shutdown: if the Minecraft server is still running when the window's
  // X button is clicked, offer to stop it gracefully so the world never corrupts.
  mainWindow.on('close', async (event) => {
    if (isQuitting) return;

    const serverActive = panelServer ? panelServer.isServerRunning() : false;

    if (serverActive) {
      event.preventDefault();

      const { response } = await dialog.showMessageBox(mainWindow, {
        type: 'warning',
        buttons: ['Stop Server & Push to GitHub', 'Force Kill & Push', 'Cancel'],
        defaultId: 0,
        cancelId: 2,
        title: 'Minecraft Server Still Running',
        message: 'The Minecraft server is still running.',
        detail: 'Closing now without a safe stop can corrupt the world. ' +
                'Choose "Stop Server & Push to GitHub" to shut it down gracefully and push your save first.'
      });

      if (response === 2) return; // cancelled — keep window open

      isQuitting = true;

      if (response === 1) {
        try { panelServer.forceKillMinecraftServer(); } catch (_) {}
      } else {
        try { panelServer.stopMinecraftServer(); } catch (_) {}
      }

      // Wait for paper.jar to fully exit (releases world/session.lock), then push
      await panelServer.waitForServerOffline(90000);
      await gitSync.pushLatest('app-close', false);
      app.exit(0);
      return;
    }

    // Server already Offline — still push manual config/plugin edits before quit
    event.preventDefault();
    isQuitting = true;
    await gitSync.pushLatest('app-close', false);
    app.exit(0);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  if (!gotLock) return;

  // Auto-pull latest code BEFORE the panel server starts so updates load now
  try {
    await gitSync.pullLatest(false);
  } catch (_) {}

  // Start the internal backend Express + WebSocket server
  panelServer = require('./server.js');

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

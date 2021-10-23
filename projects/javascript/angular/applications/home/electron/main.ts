import { app, globalShortcut, protocol } from 'electron';
import log from 'electron-log';
import * as path from 'path';

import { createTray } from './tray';
import { createWindow, getWindow, setIsQuitting } from './window';

// ==================
// GLOBAL SHORTCUTS
// ==================
app.on('ready', () => {
  globalShortcut.register('CmdOrCtrl+R', () => {});
});

// ==================
// LOGGING
// ==================
log.transports.file.level = 'info';

// ==================
// NOTIFICATIONS
// ==================
app.on('ready', () => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.tenlastic.desktop-notifications');
  }
});

// ==================
// PROTOCOL
// ==================
app.on('ready', () => {
  protocol.interceptFileProtocol('file', (request, callback) => {
    if (!request.url.includes('/assets/')) {
      return callback(request as any);
    }

    let url = request.url.substr('file'.length + 1);
    url = path.join(__dirname, '../angular', url.replace('C:/', ''));
    url = path.normalize(url);

    return callback({ path: url } as any);
  });
});

// ==================
// RELOADS
// ==================
app.allowRendererProcessReuse = false;

const instanceLock = app.requestSingleInstanceLock();
if (instanceLock) {
  app.on('activate', () => {
    createTray();
    createWindow();
  });
  app.on('before-quit', () => setIsQuitting(true));
  app.on('ready', () => {
    createTray();
    createWindow();
  });
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    const window = getWindow();
    if (!window) {
      return;
    }

    if (window.isMinimized()) {
      window.restore();
    }

    window.show();
    window.focus();
  });
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
} else {
  app.quit();
}

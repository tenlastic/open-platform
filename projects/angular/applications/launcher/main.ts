import { app, BrowserWindow, globalShortcut, protocol } from 'electron';
import log from 'electron-log';
import { autoUpdater } from 'electron-updater';
import * as path from 'path';
import { format } from 'url';

const args = process.argv.slice(1);
const serve = args.some(val => val === '--serve');
let win: BrowserWindow = null;

// ==================
// AUTOMATIC UPDATES
// ==================
autoUpdater.logger = log;
function sendStatusToWindow(text) {
  log.info(text);

  try {
    win.webContents.send('message', text);
  } catch (e) {
    log.error(e);
  }
}
autoUpdater.on('checking-for-update', () => {
  sendStatusToWindow('Checking for update...');
});
autoUpdater.on('update-available', info => {
  sendStatusToWindow('Update available.');
});
autoUpdater.on('update-not-available', info => {
  sendStatusToWindow('Update not available.');
});
autoUpdater.on('error', err => {
  sendStatusToWindow('Error in auto-updater. ' + err);
});
autoUpdater.on('download-progress', progressObj => {
  let log_message = 'Download speed: ' + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + '/' + progressObj.total + ')';
  sendStatusToWindow(log_message);
});
autoUpdater.on('update-downloaded', info => {
  sendStatusToWindow('Update downloaded');
});
app.on('ready', () => autoUpdater.checkForUpdatesAndNotify());

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
// WINDOW
// ==================
function createWindow() {
  if (win) {
    return win;
  }

  win = new BrowserWindow({
    frame: false,
    height: 640,
    webPreferences: {
      allowRunningInsecureContent: serve ? true : false,
      nodeIntegration: true,
      webSecurity: false,
    },
    width: 960,
    x: 0,
    y: 0,
  });

  if (serve) {
    require('electron-reload')(__dirname, {
      electron: require(`${__dirname}/../../node_modules/electron`),
    });
    win.loadURL('http://localhost:8083');

    win.webContents.openDevTools();
  } else {
    win.loadURL(
      format({
        pathname: path.join(__dirname, '../angular/index.html'),
        protocol: 'file:',
        slashes: true,
      }),
    );
  }

  // Emitted when the window is closed.
  win.on('closed', () => (win = null));

  return win;
}
app.on('activate', () => createWindow());
app.on('ready', () => createWindow());
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

import { BrowserWindow, shell } from 'electron';
import * as path from 'path';
import { format } from 'url';

const args = process.argv.slice(1);
let isQuitting = false;
const serve = args.some(val => val === '--serve');
let window: BrowserWindow;

export function createWindow() {
  if (window) {
    return window;
  }

  window = new BrowserWindow({
    frame: false,
    height: 720,
    resizable: serve,
    webPreferences: {
      allowRunningInsecureContent: serve,
      contextIsolation: false,
      enableRemoteModule: true,
      nodeIntegration: true,
      webSecurity: false,
    },
    width: 1280,
    x: 0,
    y: 0,
  });
  window.center();

  if (serve) {
    require('electron-reload')(__dirname, {
      electron: require(`${__dirname}/../../node_modules/electron`),
    });
    window.loadURL('http://www.localhost');

    window.webContents.openDevTools();
  } else {
    window.loadURL(
      format({
        pathname: path.join(__dirname, '../angular/index.html'),
        protocol: 'file:',
        slashes: true,
      }),
    );
  }

  // Open links in browser.
  const handleRedirect = (e, url) => {
    if (url !== window.webContents.getURL()) {
      e.preventDefault();
      shell.openExternal(url);
    }
  };

  window.webContents.on('new-window', handleRedirect);
  window.webContents.on('will-navigate', handleRedirect);

  // Emitted when the window is closed.
  window.on('close', event => {
    if (isQuitting) {
      return;
    }

    event.preventDefault();
    event.returnValue = false;
    window.hide();
  });
  window.on('closed', () => (window = null));

  return window;
}

export function getWindow() {
  return window;
}

export function setIsQuitting(value: boolean) {
  isQuitting = value;
}

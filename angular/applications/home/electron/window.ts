import { BrowserWindow, shell } from 'electron';
import * as path from 'path';
import { format } from 'url';

import { createTray } from './tray';

const args = process.argv.slice(1);
let isQuitting = false;
const serve = args.some((a) => a === '--serve');
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
      nodeIntegration: true,
      webSecurity: false,
    },
    width: serve ? 1780 : 1280,
    x: 0,
    y: 0,
  });
  window.center();

  if (serve) {
    window.loadURL('http://www.local.tenlastic.com');
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
  window.on('close', (event) => {
    if (isQuitting) {
      return;
    }

    createTray();
    event.preventDefault();
    event.returnValue = false;
    window.hide();
  });

  return window;
}

export function getWindow() {
  return window;
}

export function setIsQuitting(value: boolean) {
  isQuitting = value;
}

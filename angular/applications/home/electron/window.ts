import { app, BrowserWindow, shell } from 'electron';
import * as path from 'path';
import { pathToFileURL } from 'url';

import { createTray } from './tray';

const isDevelopment = !app.isPackaged;
let isQuitting = false;
let window: BrowserWindow;

export function createWindow() {
  if (window) {
    return window;
  }

  window = new BrowserWindow({
    frame: false,
    height: 720,
    resizable: isDevelopment,
    webPreferences: {
      allowRunningInsecureContent: isDevelopment,
      contextIsolation: false,
      nodeIntegration: true,
      webSecurity: false,
    },
    width: isDevelopment ? 1780 : 1280,
    x: 0,
    y: 0,
  });
  window.center();

  if (isDevelopment) {
    window.loadURL('http://www.local.tenlastic.com');
    window.webContents.openDevTools();
  } else {
    const url = pathToFileURL(path.join(__dirname, '../angular/index.html'));
    window.loadURL(url.href);
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

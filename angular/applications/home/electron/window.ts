import { app, BrowserWindow, Event, ipcMain } from 'electron';
import * as path from 'path';
import { pathToFileURL } from 'url';

import { createTray } from './tray';
import { createView } from './view';

const isDevelopment = !app.isPackaged;
let isQuitting = false;
let window: BrowserWindow;

export function createWindow() {
  if (window) {
    return window;
  }

  const height = 720;
  const width = 1280;
  window = new BrowserWindow({
    frame: false,
    height,
    resizable: false,
    webPreferences: {
      allowRunningInsecureContent: isDevelopment,
      contextIsolation: false,
      nodeIntegration: true,
      webSecurity: false,
    },
    width: isDevelopment ? width + 500 : width,
    x: 0,
    y: 0,
  });
  window.center();

  const rootUrl = getRootUrl();
  window.loadURL(rootUrl);

  if (isDevelopment) {
    window.webContents.openDevTools();
  }

  // Open links in browser.
  const handleRedirect = (e: Event, url: string) => {
    if (url !== window.webContents.getURL()) {
      e.preventDefault();

      const view = createView(url);
      ipcMain.on('view', (e, u) => {
        if (u) {
          view.webContents.loadURL(u);
        } else {
          ipcMain.removeAllListeners('view');
          window.removeBrowserView(view);
          window.webContents.send('view', null);
        }
      });
    }
  };

  window.webContents.on('new-window', handleRedirect);
  window.webContents.on('will-navigate', handleRedirect);
  window.webContents.on('will-redirect', handleRedirect);

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

export function getRootUrl(): string {
  if (isDevelopment) {
    return 'http://www.local.tenlastic.com';
  }

  const url = pathToFileURL(path.join(__dirname, '../angular/index.html'));
  return url.href;
}

export function getWindow() {
  return window;
}

export function setIsQuitting(value: boolean) {
  isQuitting = value;
}

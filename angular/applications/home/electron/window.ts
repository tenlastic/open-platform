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

  const rootUrl = getRootUrl();
  window.loadURL(rootUrl);

  if (isDevelopment) {
    window.webContents.openDevTools();
  }

  // Open links in browser.
  const handleRedirect = (e, url: string) => {
    if (!isDevelopment && isTenlastic(url) && url.includes('?')) {
      e.preventDefault();

      const pathname = getPathname(url);
      const rootUrl = getRootUrl();
      const urlSearchParams = getURLSearchParams(url);

      window.loadURL(`${rootUrl}#${pathname}?${urlSearchParams}`);
    } else if (isExternal(url)) {
      e.preventDefault();
      shell.openExternal(url);
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

export function getWindow() {
  return window;
}

export function setIsQuitting(value: boolean) {
  isQuitting = value;
}

function getPathname(input: string) {
  const url = new URL(input);
  return url.pathname;
}

function getRootUrl(): string {
  if (isDevelopment) {
    return 'http://www.local.tenlastic.com';
  }

  const url = pathToFileURL(path.join(__dirname, '../angular/index.html'));
  return url.href;
}

function getURLSearchParams(input: string) {
  const url = new URL(input);
  return new URLSearchParams(url.search);
}

function isExternal(url: string) {
  if (url.startsWith('https://steamcommunity.com/openid/')) {
    return false;
  }

  if (url !== window.webContents.getURL()) {
    return false;
  }

  return true;
}

function isTenlastic(input: string) {
  const url = new URL(input);
  return url.hostname.endsWith('tenlastic.com');
}

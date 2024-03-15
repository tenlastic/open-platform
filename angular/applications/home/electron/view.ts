import { app, BrowserView, Event } from 'electron';

import { size } from './preferences';
import { getWindow } from './window';

const isDevelopment = !app.isPackaged;

export function createView(url: string) {
  const view = new BrowserView();

  const window = getWindow();
  window.setBrowserView(view);

  const [width, height] = window.getSize();
  view.setBounds({ height: height - 32, width: isDevelopment ? width - size : width, x: 0, y: 32 });
  view.webContents.loadURL(url);

  // Open links in browser.
  const handleRedirect = (e: Event, u: string) => {
    if (isTenlastic(u)) {
      e.preventDefault();

      const pathname = getPathname(u);
      const urlSearchParams = getURLSearchParams(u);

      window.removeBrowserView(view);
      window.webContents.send('redirect', `${pathname}?${urlSearchParams}`);
      window.webContents.send('view', null);
    }
  };

  view.webContents.on('did-navigate', (e, u) => window.webContents.send('view', u));
  view.webContents.on('new-window', handleRedirect);
  view.webContents.on('will-navigate', handleRedirect);
  view.webContents.on('will-redirect', handleRedirect);

  window.webContents.send('view', url);

  return view;
}

function getPathname(input: string) {
  const url = new URL(input);
  return url.pathname;
}

function getURLSearchParams(input: string) {
  const url = new URL(input);
  return new URLSearchParams(url.search);
}

function isTenlastic(input: string) {
  const url = new URL(input);
  return url.hostname.endsWith('tenlastic.com');
}

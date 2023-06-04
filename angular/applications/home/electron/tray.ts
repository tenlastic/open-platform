import { app, Menu, Tray } from 'electron';
import * as path from 'path';

import { getWindow, setIsQuitting } from './window';

let tray: Tray;

export function createTray() {
  if (tray) {
    return tray;
  }

  tray = new Tray(path.join(__dirname, '../angular/assets/images/favicon-256.png'));
  tray.on('click', showWindow);
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        click: showWindow,
        label: 'Show Window',
      },
      {
        click: () => {
          setIsQuitting(true);
          app.quit();
        },
        label: 'Quit',
      },
    ]),
  );

  return tray;
}

function showWindow() {
  tray.destroy();
  tray = null;

  const window = getWindow();
  window.show();
}

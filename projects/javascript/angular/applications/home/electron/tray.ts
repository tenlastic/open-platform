import { app, Menu, Tray } from 'electron';
import * as path from 'path';

import { getWindow, setIsQuitting } from './window';

let tray: Tray;

export function createTray() {
  if (tray) {
    return tray;
  }

  const window = getWindow();

  tray = new Tray(path.join(__dirname, '../angular/assets/images/favicon-256x256.png'));
  tray.on('click', () => window.show());
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        click: () => window.show(),
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

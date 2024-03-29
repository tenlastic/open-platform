import { app, ipcMain } from 'electron';
import log from 'electron-log';
import { autoUpdater } from 'electron-updater';

import { getWindow } from './window';

export function update() {
  if (!app.isPackaged) {
    return;
  }

  app.on('ready', () => {
    autoUpdater.checkForUpdates();

    setInterval(() => {
      try {
        autoUpdater.checkForUpdates();
      } catch (e) {
        console.error(e);
      }
    }, 15 * 60 * 1000);
  });

  autoUpdater.logger = log;
  autoUpdater.on('checking-for-update', () => sendStatusToWindow('Checking for update...'));
  autoUpdater.on('download-progress', (progressObj) => {
    let log_message = 'Download speed: ' + progressObj.bytesPerSecond;
    log_message += ' - Downloaded ' + progressObj.percent + '%';
    log_message += ' (' + progressObj.transferred + '/' + progressObj.total + ')';
    sendStatusToWindow(log_message);
  });
  autoUpdater.on('error', (err) => sendStatusToWindow('Error in auto-updater. ' + err));
  autoUpdater.on('update-available', () => sendStatusToWindow('Update available.'));
  autoUpdater.on('update-downloaded', () => sendStatusToWindow('Update downloaded'));
  autoUpdater.on('update-not-available', () => sendStatusToWindow('Update not available.'));

  ipcMain.on('quitAndInstall', () => autoUpdater.quitAndInstall());
}

function sendStatusToWindow(text) {
  log.info(text);

  const window = getWindow();
  window?.webContents.send('message', text);
}

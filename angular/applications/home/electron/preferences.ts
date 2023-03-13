import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

export function setPreferences() {
  if (app.isPackaged) {
    return;
  }

  const userDataPath = app.getPath('userData');
  const preferencesPath = path.join(userDataPath, 'Preferences');

  let preferences: any;
  try {
    preferences = JSON.parse(fs.readFileSync(preferencesPath, 'utf-8'));
  } catch {
    preferences = {};
  }

  preferences.electron ??= {};
  preferences.electron.devtools ??= {};
  preferences.electron.devtools.preferences ??= {};

  const size = 500;
  const splitViewState = JSON.stringify({ horizontal: { size }, vertical: { size } });
  preferences.electron.devtools.preferences['InspectorView.splitViewState'] = splitViewState;

  fs.writeFileSync(preferencesPath, JSON.stringify(preferences));
}

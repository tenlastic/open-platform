import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

const args = process.argv.slice(1);
const serve = args.some((a) => a === '--serve');

export function setPreferences() {
  if (!serve) {
    return;
  }

  const userDataPath = app.getPath('userData');
  const preferencesPath = path.join(userDataPath, 'Preferences');
  const preferences = JSON.parse(fs.readFileSync(preferencesPath, 'utf-8'));

  const size = 500;
  preferences.electron.devtools = {
    preferences: {
      'InspectorView.splitViewState': JSON.stringify({
        vertical: { size },
        horizontal: { size },
      }),
    },
  };

  fs.writeFileSync(preferencesPath, JSON.stringify(preferences));
}

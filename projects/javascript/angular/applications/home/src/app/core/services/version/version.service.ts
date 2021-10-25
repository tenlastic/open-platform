import { Injectable } from '@angular/core';

import packageJson from '../../../../../package.json';

@Injectable({ providedIn: 'root' })
export class VersionService {
  public version = packageJson.version;
}

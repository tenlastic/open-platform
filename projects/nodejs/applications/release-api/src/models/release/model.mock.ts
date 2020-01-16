import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { Release, ReleasePlatform, ReleaseSchema } from './model';

export class ReleaseMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<ReleaseSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      executableRelativePath: './',
      gameId: mongoose.Types.ObjectId(),
      platform: this.getPlatform(),
      serverRootUrl: chance.url(),
      version: chance.hash(),
    };

    return Release.create({ ...defaults, ...params });
  }

  public static getPlatform() {
    const values = Object.values(ReleasePlatform);
    const index = Math.floor(Math.random() * values.length);

    return values[index];
  }
}

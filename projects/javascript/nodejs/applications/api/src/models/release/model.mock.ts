import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { Release, ReleaseSchema } from './model';

export class ReleaseMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<ReleaseSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      entrypoint: './',
      gameId: mongoose.Types.ObjectId(),
      version: chance.hash(),
    };

    return Release.create({ ...defaults, ...params });
  }
}

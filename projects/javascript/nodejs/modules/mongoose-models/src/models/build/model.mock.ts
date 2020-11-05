import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { Build, BuildSchema } from './model';

export class BuildMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<BuildSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      entrypoint: './',
      namespaceId: mongoose.Types.ObjectId(),
      version: chance.hash(),
    };

    return Build.create({ ...defaults, ...params });
  }
}

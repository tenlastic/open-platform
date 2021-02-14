import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { BuildLog, BuildLogSchema } from './model';

export class BuildLogMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<BuildLogSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      body: chance.hash(),
      buildId: mongoose.Types.ObjectId(),
      nodeId: chance.hash(),
      unix: Date.now(),
    };

    return BuildLog.create({ ...defaults, ...params });
  }
}

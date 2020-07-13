import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { Log, LogSchema } from './model';

export class LogMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<LogSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      gameServerId: mongoose.Types.ObjectId(),
    };

    return Log.create({ ...defaults, ...params });
  }
}

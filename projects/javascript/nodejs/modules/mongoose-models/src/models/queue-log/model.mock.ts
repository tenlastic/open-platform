import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { QueueLog, QueueLogSchema } from './model';

export class QueueLogMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<QueueLogSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      body: chance.hash(),
      namespaceId: mongoose.Types.ObjectId(),
      queueId: mongoose.Types.ObjectId(),
      unix: Date.now(),
    };

    return QueueLog.create({ ...defaults, ...params });
  }
}

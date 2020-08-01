import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { Queue, QueueSchema } from './model';

export class QueueMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<QueueSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      gameId: mongoose.Types.ObjectId(),
      name: chance.hash(),
      playersPerTeam: chance.integer(),
      teams: chance.integer(),
    };

    return Queue.create({ ...defaults, ...params });
  }
}

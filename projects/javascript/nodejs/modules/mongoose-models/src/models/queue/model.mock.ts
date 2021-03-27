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
      cpu: chance.pickone([0.1, 0.25, 0.5]),
      gameServerTemplate: {},
      memory: chance.pickone([0.1, 0.25, 0.5]),
      name: chance.hash(),
      namespaceId: mongoose.Types.ObjectId(),
      teams: chance.integer(),
      usersPerTeam: chance.integer(),
    };

    return Queue.create({ ...defaults, ...params });
  }
}

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
      cpu: chance.pickone([1, 3, 5]),
      gameServerTemplate: {},
      memory: chance.pickone([1, 3, 5]),
      name: chance.hash(),
      namespaceId: mongoose.Types.ObjectId(),
      replicas: chance.pickone([1, 3, 5]),
      teams: chance.integer(),
      usersPerTeam: chance.integer(),
    };

    return Queue.create({ ...defaults, ...params });
  }
}

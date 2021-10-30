import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { Database, DatabaseSchema } from './model';

export class DatabaseMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<DatabaseSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      cpu: chance.floating({ max: 1, min: 0.1 }),
      memory: chance.integer({ max: 1 * 1000 * 1000 * 1000, min: 250 * 1000 * 1000 }),
      name: chance.hash(),
      namespaceId: mongoose.Types.ObjectId(),
      replicas: chance.pickone([1, 3, 5]),
      storage: chance.integer({ max: 25 * 1000 * 1000 * 1000, min: 5 * 1000 * 1000 * 1000 }),
    };

    return Database.create({ ...defaults, ...params });
  }
}

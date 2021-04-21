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
      cpu: chance.pickone([1, 3, 5]),
      memory: chance.pickone([1, 3, 5]),
      name: chance.hash(),
      namespaceId: mongoose.Types.ObjectId(),
      replicas: chance.pickone([1, 3, 5]),
      storage: chance.pickone([1, 3, 5]),
    };

    return Database.create({ ...defaults, ...params });
  }
}

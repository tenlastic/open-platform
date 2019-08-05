import * as Chance from 'chance';

import { Database, DatabaseSchema } from './model';

export class DatabaseMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<DatabaseSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      name: chance.hash(),
      userId: chance.hash(),
    };

    return Database.create({ ...defaults, ...params });
  }
}

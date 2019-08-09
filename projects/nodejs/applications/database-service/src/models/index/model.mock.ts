import * as Chance from 'chance';

import { IndexSchema } from './model';

export class IndexMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<IndexSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      key: { [chance.hash()]: chance.integer({ max: 1, min: 0 }) },
    };

    return { ...defaults, ...params };
  }
}

import * as Chance from 'chance';

import { Record, RecordSchema } from './record.model';

export class RecordMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<RecordSchema> = {}) {
    const chance = new Chance();

    const defaults = {};

    return Record.create({ ...defaults, ...params });
  }
}

import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { Record, RecordSchema } from './record.model';

export class RecordMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<RecordSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      collectionId: new mongoose.Types.ObjectId(),
      databaseId: new mongoose.Types.ObjectId(),
      properties: {},
    };

    return Record.create({ ...defaults, ...params });
  }
}

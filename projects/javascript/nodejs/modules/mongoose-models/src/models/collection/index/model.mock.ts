import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { CollectionIndex, CollectionIndexSchema } from './model';

export class CollectionIndexMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async new(params: Partial<CollectionIndexSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      collectionId: mongoose.Types.ObjectId(),
      key: { [chance.hash()]: chance.integer({ max: 1, min: 0 }) },
    };

    return new CollectionIndex({ ...defaults, ...params });
  }
}

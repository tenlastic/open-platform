import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { Collection, CollectionSchema } from './model';

export class CollectionMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<CollectionSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      name: chance.hash(),
      namespaceId: new mongoose.Types.ObjectId(),
    };

    return Collection.create({ ...defaults, ...params });
  }
}

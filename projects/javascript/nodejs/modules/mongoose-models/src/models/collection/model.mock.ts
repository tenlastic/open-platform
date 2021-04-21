import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { Collection, CollectionModel } from './model';

export class CollectionMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<CollectionModel> = {}) {
    const chance = new Chance();

    const defaults = {
      databaseId: new mongoose.Types.ObjectId(),
      name: chance.hash(),
      namespaceId: new mongoose.Types.ObjectId(),
    };

    return Collection.create({ ...defaults, ...params });
  }
}

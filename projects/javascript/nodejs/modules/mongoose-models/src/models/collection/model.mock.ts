import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { DatabaseMock } from '../database';
import { Collection, CollectionSchema } from './model';

export class CollectionMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<CollectionSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      databaseId: new mongoose.Types.ObjectId(),
      name: chance.hash(),
      namespaceId: new mongoose.Types.ObjectId(),
    };

    if (!params.databaseId) {
      const database = await DatabaseMock.create({
        namespaceId: params.namespaceId ?? defaults.namespaceId,
      });
      defaults.databaseId = database._id;
    }

    return Collection.create({ ...defaults, ...params });
  }
}

import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { ReadonlyNamespace, ReadonlyNamespaceSchema } from './model';

export class ReadonlyNamespaceMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<ReadonlyNamespaceSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      _id: mongoose.Types.ObjectId(),
      name: chance.hash(),
    };

    return ReadonlyNamespace.create({ ...defaults, ...params });
  }
}

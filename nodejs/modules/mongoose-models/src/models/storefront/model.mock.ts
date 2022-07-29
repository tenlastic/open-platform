import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { Storefront, StorefrontAccess, StorefrontSchema } from './model';

export class StorefrontMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<StorefrontSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      access: StorefrontAccess.Private,
      namespaceId: new mongoose.Types.ObjectId(),
      title: chance.hash(),
    };

    return Storefront.create({ ...defaults, ...params });
  }
}

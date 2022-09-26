import * as Chance from 'chance';

import { Namespace, NamespaceSchema } from './model';

export class NamespaceMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<NamespaceSchema> = {}) {
    const chance = new Chance();

    const defaults = { name: chance.hash() };

    return Namespace.create({ ...defaults, ...params });
  }
}

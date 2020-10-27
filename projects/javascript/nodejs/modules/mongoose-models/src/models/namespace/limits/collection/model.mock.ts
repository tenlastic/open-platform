import { Chance } from 'chance';

import { NamespaceCollectionLimits, NamespaceCollectionLimitsSchema } from './model';

export class NamespaceCollectionLimitsMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<NamespaceCollectionLimitsSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      count: chance.integer(),
      size: chance.integer(),
    };

    return new NamespaceCollectionLimits({ ...defaults, ...params });
  }
}

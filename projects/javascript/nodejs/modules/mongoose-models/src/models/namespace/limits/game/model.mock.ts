import { Chance } from 'chance';

import { NamespaceGameLimits, NamespaceGameLimitsSchema } from './model';

export class NamespaceGameLimitsMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<NamespaceGameLimitsSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      images: chance.integer(),
      size: chance.integer(),
      videos: chance.integer(),
    };

    return new NamespaceGameLimits({ ...defaults, ...params });
  }
}

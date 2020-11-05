import { Chance } from 'chance';

import { NamespaceBuildLimits, NamespaceBuildLimitsSchema } from './model';

export class NamespaceBuildLimitsMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<NamespaceBuildLimitsSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      count: chance.integer(),
      size: chance.integer(),
    };

    return new NamespaceBuildLimits({ ...defaults, ...params });
  }
}

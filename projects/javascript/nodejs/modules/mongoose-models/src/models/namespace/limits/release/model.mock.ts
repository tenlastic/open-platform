import { Chance } from 'chance';

import { NamespaceReleaseLimits, NamespaceReleaseLimitsSchema } from './model';

export class NamespaceReleaseLimitsMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<NamespaceReleaseLimitsSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      count: chance.integer(),
      size: chance.integer(),
    };

    return new NamespaceReleaseLimits({ ...defaults, ...params });
  }
}

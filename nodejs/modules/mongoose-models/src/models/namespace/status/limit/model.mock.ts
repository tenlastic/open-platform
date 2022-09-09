import { Chance } from 'chance';

import {
  NamespaceStatusLimit,
  NamespaceStatusLimitName,
  NamespaceStatusLimitSchema,
} from './model';

export class NamespaceStatusLimitMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<NamespaceStatusLimitSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      current: chance.integer({ min: 0 }),
      name: NamespaceStatusLimitName.Bandwidth,
      total: chance.integer({ min: 0 }),
    };

    return new NamespaceStatusLimit({ ...defaults, ...params });
  }
}

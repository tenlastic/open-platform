import { NamespaceLimits, NamespaceLimitsSchema } from './model';

export class NamespaceLimitsMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<NamespaceLimitsSchema> = {}) {
    const defaults = {};

    return new NamespaceLimits({ ...defaults, ...params });
  }
}

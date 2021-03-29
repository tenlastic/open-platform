import { NamespaceDatabaseLimits, NamespaceDatabaseLimitsSchema } from './model';

export class NamespaceDatabaseLimitsMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<NamespaceDatabaseLimitsSchema> = {}) {
    const defaults = {};

    return new NamespaceDatabaseLimits({ ...defaults, ...params });
  }
}

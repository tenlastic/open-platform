import { NamespaceBuildLimits, NamespaceBuildLimitsSchema } from './model';

export class NamespaceBuildLimitsMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<NamespaceBuildLimitsSchema> = {}) {
    const defaults = {};

    return new NamespaceBuildLimits({ ...defaults, ...params });
  }
}

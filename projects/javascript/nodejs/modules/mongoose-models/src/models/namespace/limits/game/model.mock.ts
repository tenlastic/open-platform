import { NamespaceGameLimits, NamespaceGameLimitsSchema } from './model';

export class NamespaceGameLimitsMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<NamespaceGameLimitsSchema> = {}) {
    const defaults = {};

    return new NamespaceGameLimits({ ...defaults, ...params });
  }
}

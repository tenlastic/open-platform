import { NamespaceStorefrontLimits, NamespaceStorefrontLimitsSchema } from './model';

export class NamespaceStorefrontLimitsMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<NamespaceStorefrontLimitsSchema> = {}) {
    const defaults = {};

    return new NamespaceStorefrontLimits({ ...defaults, ...params });
  }
}

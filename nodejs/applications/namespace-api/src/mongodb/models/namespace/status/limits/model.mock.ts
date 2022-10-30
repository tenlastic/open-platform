import { NamespaceStatusLimits, NamespaceStatusLimitsSchema } from './model';

export class NamespaceStatusLimitsMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<NamespaceStatusLimitsSchema> = {}) {
    const defaults = {};

    return new NamespaceStatusLimits({ ...defaults, ...params });
  }
}

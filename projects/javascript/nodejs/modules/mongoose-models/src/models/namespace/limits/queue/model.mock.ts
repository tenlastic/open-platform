import { NamespaceQueueLimits, NamespaceQueueLimitsSchema } from './model';

export class NamespaceQueueLimitsMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<NamespaceQueueLimitsSchema> = {}) {
    const defaults = {};

    return new NamespaceQueueLimits({ ...defaults, ...params });
  }
}

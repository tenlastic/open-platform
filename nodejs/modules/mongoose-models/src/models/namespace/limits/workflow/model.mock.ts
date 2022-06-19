import { NamespaceWorkflowLimits, NamespaceWorkflowLimitsSchema } from './model';

export class NamespaceWorkflowLimitsMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<NamespaceWorkflowLimitsSchema> = {}) {
    const defaults = {};

    return new NamespaceWorkflowLimits({ ...defaults, ...params });
  }
}

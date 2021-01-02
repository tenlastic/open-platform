import { WorkflowStatus, WorkflowStatusSchema } from './model';

export class WorkflowStatusMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<WorkflowStatusSchema> = {}) {
    const defaults = {};

    return new WorkflowStatus({ ...defaults, ...params });
  }
}

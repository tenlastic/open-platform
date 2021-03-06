import { WorkflowStatusNode, WorkflowStatusNodeSchema } from './model';

export class WorkflowStatusNodeMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<WorkflowStatusNodeSchema> = {}) {
    const defaults = {};

    return new WorkflowStatusNode({ ...defaults, ...params });
  }
}

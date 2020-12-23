import { WorkflowSpecArguments, WorkflowSpecArgumentsSchema } from './model';

export class WorkflowSpecArgumentsMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<WorkflowSpecArgumentsSchema> = {}) {
    const defaults = {};

    return new WorkflowSpecArguments({ ...defaults, ...params });
  }
}

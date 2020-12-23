import { WorkflowSpecTaskArguments, WorkflowSpecTaskArgumentsSchema } from './model';

export class WorkflowSpecTaskArgumentsMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<WorkflowSpecTaskArgumentsSchema> = {}) {
    const defaults = {};

    return new WorkflowSpecTaskArguments({ ...defaults, ...params });
  }
}

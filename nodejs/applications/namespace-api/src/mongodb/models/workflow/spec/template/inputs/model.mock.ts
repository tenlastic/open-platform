import { WorkflowSpecTemplateInputs, WorkflowSpecTemplateInputsSchema } from './model';

export class WorkflowSpecTemplateInputsMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<WorkflowSpecTemplateInputsSchema> = {}) {
    const defaults = {};

    return new WorkflowSpecTemplateInputs({ ...defaults, ...params });
  }
}

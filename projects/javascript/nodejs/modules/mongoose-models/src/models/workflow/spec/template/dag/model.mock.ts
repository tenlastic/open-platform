import { WorkflowSpecTemplateDag, WorkflowSpecTemplateDagSchema } from './model';
import { WorkflowSpecTemplateDagTaskMock } from './task';

export class WorkflowSpecTemplateDagMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<WorkflowSpecTemplateDagSchema> = {}) {
    const defaults = {
      tasks: [WorkflowSpecTemplateDagTaskMock.create()],
    };

    return new WorkflowSpecTemplateDag({ ...defaults, ...params });
  }
}

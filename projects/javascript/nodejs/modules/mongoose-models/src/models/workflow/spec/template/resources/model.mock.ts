import { WorkflowSpecTemplateResources, WorkflowSpecTemplateResourcesSchema } from './model';

export class WorkflowSpecTemplateResourcesMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<WorkflowSpecTemplateResourcesSchema> = {}) {
    const defaults = {};

    return new WorkflowSpecTemplateResources({ ...defaults, ...params });
  }
}

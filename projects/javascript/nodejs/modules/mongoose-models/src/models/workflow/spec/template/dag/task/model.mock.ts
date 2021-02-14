import * as Chance from 'chance';

import { WorkflowSpecTemplateDagTask, WorkflowSpecTemplateDagTaskSchema } from './model';

export class WorkflowSpecTemplateDagTaskMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<WorkflowSpecTemplateDagTaskSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      name: chance.hash(),
      template: chance.hash(),
    };

    return new WorkflowSpecTemplateDagTask({ ...defaults, ...params });
  }
}

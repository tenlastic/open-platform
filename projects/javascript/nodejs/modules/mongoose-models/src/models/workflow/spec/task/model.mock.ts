import * as Chance from 'chance';

import { WorkflowSpecTask, WorkflowSpecTaskSchema } from './model';

export class WorkflowSpecTaskMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<WorkflowSpecTaskSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      name: chance.hash(),
      template: chance.hash(),
    };

    return new WorkflowSpecTask({ ...defaults, ...params });
  }
}

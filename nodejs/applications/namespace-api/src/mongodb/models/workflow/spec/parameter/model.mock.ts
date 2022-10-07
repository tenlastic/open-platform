import * as Chance from 'chance';

import { WorkflowSpecParameter, WorkflowSpecParameterSchema } from './model';

export class WorkflowSpecParameterMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<WorkflowSpecParameterSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      name: chance.hash(),
      value: chance.hash(),
    };

    return new WorkflowSpecParameter({ ...defaults, ...params });
  }
}

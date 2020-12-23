import * as Chance from 'chance';

import { WorkflowSpecArgumentsParameter, WorkflowSpecArgumentsParameterSchema } from './model';

export class WorkflowSpecArgumentsParameterMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<WorkflowSpecArgumentsParameterSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      name: chance.hash(),
      value: chance.hash(),
    };

    return new WorkflowSpecArgumentsParameter({ ...defaults, ...params });
  }
}

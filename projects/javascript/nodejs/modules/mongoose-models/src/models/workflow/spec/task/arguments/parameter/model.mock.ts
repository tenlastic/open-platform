import * as Chance from 'chance';

import {
  WorkflowSpecTaskArgumentsParameter,
  WorkflowSpecTaskArgumentsParameterSchema,
} from './model';

export class WorkflowSpecTaskArgumentsParameterMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<WorkflowSpecTaskArgumentsParameterSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      name: chance.hash(),
      value: chance.hash(),
    };

    return new WorkflowSpecTaskArgumentsParameter({ ...defaults, ...params });
  }
}

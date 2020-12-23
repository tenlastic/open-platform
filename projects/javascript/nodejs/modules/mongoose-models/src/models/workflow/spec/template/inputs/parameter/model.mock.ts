import * as Chance from 'chance';

import {
  WorkflowSpecTemplateInputsParameter,
  WorkflowSpecTemplateInputsParameterSchema,
} from './model';

export class WorkflowSpecTemplateInputsParameterMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<WorkflowSpecTemplateInputsParameterSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      name: chance.hash(),
      value: chance.hash(),
    };

    return new WorkflowSpecTemplateInputsParameter({ ...defaults, ...params });
  }
}

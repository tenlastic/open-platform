import * as Chance from 'chance';

import { WorkflowSpecEnv, WorkflowSpecEnvSchema } from './model';

export class WorkflowSpecEnvMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<WorkflowSpecEnvSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      name: chance.hash(),
      value: chance.hash(),
    };

    return new WorkflowSpecEnv({ ...defaults, ...params });
  }
}

import * as Chance from 'chance';

import { WorkflowSpecTemplateSidecarEnv, WorkflowSpecTemplateSidecarEnvSchema } from './model';

export class WorkflowSpecTemplateSidecarEnvMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<WorkflowSpecTemplateSidecarEnvSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      name: chance.hash(),
      value: chance.hash(),
    };

    return new WorkflowSpecTemplateSidecarEnv({ ...defaults, ...params });
  }
}

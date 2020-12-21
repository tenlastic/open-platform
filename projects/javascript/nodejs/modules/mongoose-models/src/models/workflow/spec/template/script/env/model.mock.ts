import * as Chance from 'chance';

import { WorkflowSpecTemplateScriptEnv, WorkflowSpecTemplateScriptEnvSchema } from './model';

export class WorkflowSpecTemplateScriptEnvMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<WorkflowSpecTemplateScriptEnvSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      name: chance.hash(),
      value: chance.hash(),
    };

    return new WorkflowSpecTemplateScriptEnv({ ...defaults, ...params });
  }
}

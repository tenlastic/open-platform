import * as Chance from 'chance';

import { PipelineSpecTemplateScriptEnv, PipelineSpecTemplateScriptEnvSchema } from './model';

export class PipelineSpecTemplateScriptEnvMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<PipelineSpecTemplateScriptEnvSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      name: chance.hash(),
      value: chance.hash(),
    };

    return new PipelineSpecTemplateScriptEnv({ ...defaults, ...params });
  }
}

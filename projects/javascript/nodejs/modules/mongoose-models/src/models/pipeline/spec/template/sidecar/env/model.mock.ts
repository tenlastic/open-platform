import * as Chance from 'chance';

import { PipelineSpecTemplateSidecarEnv, PipelineSpecTemplateSidecarEnvSchema } from './model';

export class PipelineSpecTemplateSidecarEnvMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<PipelineSpecTemplateSidecarEnvSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      name: chance.hash(),
      value: chance.hash(),
    };

    return new PipelineSpecTemplateSidecarEnv({ ...defaults, ...params });
  }
}

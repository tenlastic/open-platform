import * as Chance from 'chance';

import { PipelineSpecTemplateSidecar, PipelineSpecTemplateSidecarSchema } from './model';

export class PipelineSpecTemplateSidecarMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<PipelineSpecTemplateSidecarSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      image: chance.hash(),
      name: chance.hash(),
    };

    return new PipelineSpecTemplateSidecar({ ...defaults, ...params });
  }
}

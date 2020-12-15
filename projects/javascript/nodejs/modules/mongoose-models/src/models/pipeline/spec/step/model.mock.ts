import * as Chance from 'chance';

import { PipelineSpecStep, PipelineSpecStepSchema } from './model';

export class PipelineSpecStepMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<PipelineSpecStepSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      name: chance.hash(),
      template: chance.hash(),
    };

    return new PipelineSpecStep({ ...defaults, ...params });
  }
}

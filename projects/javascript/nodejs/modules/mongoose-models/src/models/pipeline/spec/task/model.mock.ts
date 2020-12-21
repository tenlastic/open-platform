import * as Chance from 'chance';

import { PipelineSpecTask, PipelineSpecTaskSchema } from './model';

export class PipelineSpecTaskMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<PipelineSpecTaskSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      name: chance.hash(),
      template: chance.hash(),
    };

    return new PipelineSpecTask({ ...defaults, ...params });
  }
}

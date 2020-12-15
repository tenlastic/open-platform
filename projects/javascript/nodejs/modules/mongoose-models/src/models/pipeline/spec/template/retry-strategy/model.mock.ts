import * as Chance from 'chance';

import {
  PipelineSpecTemplateRetryStrategy,
  PipelineSpecTemplateRetryStrategyRetryPolicy,
  PipelineSpecTemplateRetryStrategySchema,
} from './model';

export class PipelineSpecTemplateRetryStrategyMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<PipelineSpecTemplateRetryStrategySchema> = {}) {
    const chance = new Chance();

    const defaults = {
      limit: chance.integer({ max: 10, min: 1 }),
      retryPolicy: PipelineSpecTemplateRetryStrategyRetryPolicy.OnError,
    };

    return new PipelineSpecTemplateRetryStrategy({ ...defaults, ...params });
  }
}

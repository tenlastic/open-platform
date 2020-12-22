import * as Chance from 'chance';

import {
  WorkflowSpecTemplateRetryStrategy,
  WorkflowSpecTemplateRetryStrategyRetryPolicy,
  WorkflowSpecTemplateRetryStrategySchema,
} from './model';

export class WorkflowSpecTemplateRetryStrategyMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<WorkflowSpecTemplateRetryStrategySchema> = {}) {
    const chance = new Chance();

    const defaults = {
      limit: chance.integer({ max: 10, min: 1 }),
      retryPolicy: WorkflowSpecTemplateRetryStrategyRetryPolicy.OnError,
    };

    return new WorkflowSpecTemplateRetryStrategy({ ...defaults, ...params });
  }
}

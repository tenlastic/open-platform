import * as Chance from 'chance';

import { WorkflowSpecTemplate, WorkflowSpecTemplateSchema } from './model';

export class WorkflowSpecTemplateMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<WorkflowSpecTemplateSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      name: chance.hash(),
    };

    return new WorkflowSpecTemplate({ ...defaults, ...params });
  }
}

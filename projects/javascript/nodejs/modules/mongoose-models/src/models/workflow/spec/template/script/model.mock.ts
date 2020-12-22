import * as Chance from 'chance';

import { WorkflowSpecTemplateScript, WorkflowSpecTemplateScriptSchema } from './model';

export class WorkflowSpecTemplateScriptMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<WorkflowSpecTemplateScriptSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      image: chance.hash(),
      source: chance.hash(),
    };

    return new WorkflowSpecTemplateScript({ ...defaults, ...params });
  }
}

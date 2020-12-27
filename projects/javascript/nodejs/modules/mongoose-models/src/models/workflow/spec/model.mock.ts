import * as Chance from 'chance';

import { WorkflowSpec, WorkflowSpecSchema } from './model';
import { WorkflowSpecTemplateMock } from './template';

export class WorkflowSpecMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<WorkflowSpecSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      entrypoint: chance.hash(),
      templates: [WorkflowSpecTemplateMock.create()],
    };

    return new WorkflowSpec({ ...defaults, ...params });
  }
}

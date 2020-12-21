import * as Chance from 'chance';

import { WorkflowSpecTemplateSidecar, WorkflowSpecTemplateSidecarSchema } from './model';

export class WorkflowSpecTemplateSidecarMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<WorkflowSpecTemplateSidecarSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      image: chance.hash(),
      name: chance.hash(),
    };

    return new WorkflowSpecTemplateSidecar({ ...defaults, ...params });
  }
}

import * as Chance from 'chance';

import {
  WorkflowSpecEnvValueFromSecretKeyRef,
  WorkflowSpecEnvValueFromSecretKeyRefSchema,
} from './model';

export class WorkflowSpecEnvValueFromSecretKeyRefMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<WorkflowSpecEnvValueFromSecretKeyRefSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      key: chance.hash(),
      name: chance.hash(),
    };

    return new WorkflowSpecEnvValueFromSecretKeyRef({ ...defaults, ...params });
  }
}

import * as Chance from 'chance';

import { BuildTaskFailure, BuildTaskFailureSchema } from './model';

export class BuildTaskFailureMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<BuildTaskFailureSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      message: chance.hash(),
    };

    return new BuildTaskFailure({ ...defaults, ...params });
  }
}

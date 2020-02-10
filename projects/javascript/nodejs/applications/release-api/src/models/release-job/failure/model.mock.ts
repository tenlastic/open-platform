import * as Chance from 'chance';

import { ReleaseJobFailure, ReleaseJobFailureSchema } from './model';

export class ReleaseJobFailureMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<ReleaseJobFailureSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      message: chance.hash(),
    };

    return new ReleaseJobFailure({ ...defaults, ...params });
  }
}

import * as Chance from 'chance';

import { ReleaseTaskFailure, ReleaseTaskFailureSchema } from './model';

export class ReleaseTaskFailureMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<ReleaseTaskFailureSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      message: chance.hash(),
    };

    return new ReleaseTaskFailure({ ...defaults, ...params });
  }
}

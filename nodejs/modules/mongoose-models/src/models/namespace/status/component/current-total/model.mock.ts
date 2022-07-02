import { CurrentTotal, CurrentTotalSchema } from './model';

export class CurrentTotalMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<CurrentTotalSchema> = {}) {
    const defaults = {};

    return new CurrentTotal({ ...defaults, ...params });
  }
}

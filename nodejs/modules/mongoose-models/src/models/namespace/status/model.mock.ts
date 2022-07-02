import { Phase, Status, StatusSchema } from './model';

export class StatusMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<StatusSchema> = {}) {
    const defaults = { phase: Phase.Running };

    return new Status({ ...defaults, ...params });
  }
}

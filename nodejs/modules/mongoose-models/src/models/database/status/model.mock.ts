import { DatabaseStatus, DatabaseStatusPhase, DatabaseStatusSchema } from './model';

export class DatabaseStatusMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<DatabaseStatusSchema> = {}) {
    const defaults = { phase: DatabaseStatusPhase.Running };

    return new DatabaseStatus({ ...defaults, ...params });
  }
}

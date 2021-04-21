import { DatabaseStatusPhase } from '../model';
import { DatabaseStatusNode, DatabaseStatusNodeSchema } from './model';

export class DatabaseStatusNodeMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<DatabaseStatusNodeSchema> = {}) {
    const defaults = { phase: DatabaseStatusPhase.Running };

    return new DatabaseStatusNode({ ...defaults, ...params });
  }
}

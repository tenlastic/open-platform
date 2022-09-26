import { QueueStatusPhase } from '../model';
import { QueueStatusNode, QueueStatusNodeSchema } from './model';

export class QueueStatusNodeMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<QueueStatusNodeSchema> = {}) {
    const defaults = { phase: QueueStatusPhase.Running };

    return new QueueStatusNode({ ...defaults, ...params });
  }
}

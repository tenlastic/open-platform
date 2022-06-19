import { QueueStatus, QueueStatusPhase, QueueStatusSchema } from './model';

export class QueueStatusMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<QueueStatusSchema> = {}) {
    const defaults = { phase: QueueStatusPhase.Running };

    return new QueueStatus({ ...defaults, ...params });
  }
}

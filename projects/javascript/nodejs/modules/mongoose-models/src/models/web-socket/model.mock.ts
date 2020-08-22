import * as mongoose from 'mongoose';

import { WebSocket, WebSocketSchema } from './model';

export class WebSocketMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<WebSocketSchema> = {}) {
    const defaults = {
      userId: mongoose.Types.ObjectId(),
    };

    return WebSocket.create({ ...defaults, ...params });
  }
}

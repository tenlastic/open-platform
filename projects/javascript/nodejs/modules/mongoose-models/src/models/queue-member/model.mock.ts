import * as mongoose from 'mongoose';

import { WebSocketMock } from '../web-socket';
import { QueueMember, QueueMemberDocument, QueueMemberSchema } from './model';

export class QueueMemberMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<QueueMemberSchema> = {}) {
    const defaults: Partial<QueueMemberDocument> = {
      queueId: mongoose.Types.ObjectId(),
      userId: mongoose.Types.ObjectId(),
    };

    if (!params.webSocketId) {
      const webSocket = await WebSocketMock.create({ userId: params.userId || defaults.userId });
      defaults.webSocketId = webSocket._id;
    }

    return QueueMember.create({ ...defaults, ...params });
  }
}

import * as mongoose from 'mongoose';

import { QueueMember, QueueMemberDocument, QueueMemberSchema } from './model';

export class QueueMemberMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<QueueMemberSchema> = {}) {
    const defaults: Partial<QueueMemberDocument> = {
      namespaceId: new mongoose.Types.ObjectId(),
      queueId: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(),
    };

    return QueueMember.create({ ...defaults, ...params });
  }
}

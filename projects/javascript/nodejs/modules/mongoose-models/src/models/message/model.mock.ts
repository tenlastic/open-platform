import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { Message, MessageSchema } from './model';

export class MessageMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<MessageSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      body: chance.hash(),
      fromUserId: new mongoose.Types.ObjectId(),
      toUserId: new mongoose.Types.ObjectId(),
    };

    return Message.create({ ...defaults, ...params });
  }
}

import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { QueueMember, QueueMemberSchema } from './model';

export class QueueMemberMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<QueueMemberSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      jti: chance.hash(),
      queueId: mongoose.Types.ObjectId(),
      userId: mongoose.Types.ObjectId(),
    };

    return QueueMember.create({ ...defaults, ...params });
  }
}

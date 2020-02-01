import * as mongoose from 'mongoose';

import { Friend, FriendSchema } from './model';

export class FriendMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<FriendSchema> = {}) {
    const defaults = {
      fromUserId: mongoose.Types.ObjectId(),
      toUserId: mongoose.Types.ObjectId(),
    };

    return Friend.create({ ...defaults, ...params });
  }
}

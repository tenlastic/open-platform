import * as mongoose from 'mongoose';

import { Ignoration, IgnorationSchema } from './model';

export class IgnorationMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<IgnorationSchema> = {}) {
    const defaults = {
      fromUserId: mongoose.Types.ObjectId(),
      toUserId: mongoose.Types.ObjectId(),
    };

    return Ignoration.create({ ...defaults, ...params });
  }
}

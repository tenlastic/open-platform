import * as mongoose from 'mongoose';

import { Login, LoginSchema } from './model';

export class LoginMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<LoginSchema> = {}) {
    const defaults = {
      userId: new mongoose.Types.ObjectId(),
    };

    return Login.create({ ...defaults, ...params });
  }
}

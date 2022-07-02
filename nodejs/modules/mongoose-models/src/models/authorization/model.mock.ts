import * as mongoose from 'mongoose';

import { Authorization, AuthorizationSchema } from './model';

export class AuthorizationMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<AuthorizationSchema> = {}) {
    const defaults = {
      namespaceId: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(),
    };

    return Authorization.create({ ...defaults, ...params });
  }
}

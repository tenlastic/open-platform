import * as mongoose from 'mongoose';

import { NamespaceUser, NamespaceUserSchema } from './model';

export class NamespaceUserMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<NamespaceUserSchema> = {}) {
    const defaults = {
      userId: new mongoose.Types.ObjectId(),
    };

    return new NamespaceUser({ ...defaults, ...params });
  }
}

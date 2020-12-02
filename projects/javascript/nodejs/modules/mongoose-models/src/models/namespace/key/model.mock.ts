import * as mongoose from 'mongoose';

import { NamespaceKey, NamespaceKeySchema } from './model';

export class NamespaceKeyMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<NamespaceKeySchema> = {}) {
    const defaults = {
      userId: mongoose.Types.ObjectId(),
    };

    return new NamespaceKey({ ...defaults, ...params });
  }
}

import * as mongoose from 'mongoose';

import { Connection, ConnectionSchema } from './model';

export class ConnectionMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<ConnectionSchema> = {}) {
    const defaults = {
      userId: mongoose.Types.ObjectId(),
    };

    return Connection.create({ ...defaults, ...params });
  }
}

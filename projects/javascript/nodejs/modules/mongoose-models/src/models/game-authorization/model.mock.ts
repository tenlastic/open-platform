import * as mongoose from 'mongoose';

import { GameAuthorization, GameAuthorizationSchema } from './model';

export class GameAuthorizationMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<GameAuthorizationSchema> = {}) {
    const defaults = {
      gameId: new mongoose.Types.ObjectId(),
      namespaceId: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(),
    };

    return GameAuthorization.create({ ...defaults, ...params });
  }
}

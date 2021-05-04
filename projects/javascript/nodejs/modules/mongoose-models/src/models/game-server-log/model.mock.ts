import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { GameServerLog, GameServerLogSchema } from './model';

export class GameServerLogMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<GameServerLogSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      body: chance.hash(),
      gameServerId: mongoose.Types.ObjectId(),
      namespaceId: mongoose.Types.ObjectId(),
      unix: Date.now(),
    };

    return GameServerLog.create({ ...defaults, ...params });
  }
}

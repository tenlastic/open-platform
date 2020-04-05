import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { GameServer, GameServerSchema } from './model';

export class GameServerMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<GameServerSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      gameId: mongoose.Types.ObjectId(),
      name: chance.hash(),
    };

    return GameServer.create({ ...defaults, ...params });
  }
}

import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { Game, GameAccess, GameSchema } from './model';

export class GameMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<GameSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      access: GameAccess.Private,
      namespaceId: mongoose.Types.ObjectId(),
      title: chance.hash(),
    };

    return Game.create({ ...defaults, ...params });
  }
}

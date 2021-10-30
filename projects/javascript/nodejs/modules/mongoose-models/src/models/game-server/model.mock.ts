import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { BuildMock } from '../build';
import { GameServer, GameServerSchema } from './model';

export class GameServerMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<GameServerSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      buildId: mongoose.Types.ObjectId(),
      cpu: chance.pickone([0.1, 0.25, 0.5]),
      memory: chance.pickone([0.1, 0.25, 0.5]),
      name: chance.hash(),
      namespaceId: mongoose.Types.ObjectId(),
    };

    if (!params.buildId) {
      const build = await BuildMock.create({
        namespaceId: params.namespaceId ?? defaults.namespaceId,
      });
      defaults.buildId = build._id;
    }

    return GameServer.create({ ...defaults, ...params });
  }
}

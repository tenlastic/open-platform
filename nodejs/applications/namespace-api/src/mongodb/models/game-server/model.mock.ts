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
      buildId: new mongoose.Types.ObjectId(),
      cpu: chance.floating({ max: 1, min: 0.1 }),
      memory: chance.integer({ max: 1 * 1000 * 1000 * 1000, min: 100 * 1000 * 1000 }),
      name: chance.hash(),
      namespaceId: new mongoose.Types.ObjectId(),
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

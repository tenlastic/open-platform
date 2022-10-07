import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { BuildMock } from '../build';
import { GameServerTemplateMock } from './game-server-template';
import { Queue, QueueSchema } from './model';

export class QueueMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<QueueSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      cpu: chance.floating({ max: 1, min: 0.1 }),
      gameServerTemplate: GameServerTemplateMock.create(),
      memory: chance.integer({ max: 1 * 1000 * 1000 * 1000, min: 100 * 1000 * 1000 }),
      name: chance.hash(),
      namespaceId: new mongoose.Types.ObjectId(),
      replicas: chance.pickone([1, 3, 5]),
      teams: chance.integer({ min: 1 }),
      usersPerTeam: chance.integer({ min: 1 }),
    };

    if (!params.gameServerTemplate?.buildId) {
      const build = await BuildMock.create({
        namespaceId: params.namespaceId ?? defaults.namespaceId,
      });
      defaults.gameServerTemplate.buildId = build._id;
    }

    return Queue.create({ ...defaults, ...params });
  }
}

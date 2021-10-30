import * as Chance from 'chance';

import { GameServerTemplate, GameServerTemplateSchema } from './model';

export class GameServerTemplateMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<GameServerTemplateSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      cpu: chance.pickone([0.1, 0.25, 0.5]),
      memory: chance.pickone([0.1, 0.25, 0.5]),
      name: chance.hash(),
    };

    return new GameServerTemplate({ ...defaults, ...params });
  }
}

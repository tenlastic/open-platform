import * as Chance from 'chance';

import { GameServerTemplate, GameServerTemplateSchema } from './model';

export class GameServerTemplateMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<GameServerTemplateSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      cpu: chance.floating({ max: 1, min: 0.1 }),
      memory: chance.integer({ max: 1 * 1000 * 1000 * 1000, min: 250 * 1000 * 1000 }),
      name: chance.hash(),
    };

    return new GameServerTemplate({ ...defaults, ...params });
  }
}
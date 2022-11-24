import { Chance } from 'chance';

import { GameServerStatusComponentName, GameServerStatusPhase } from '../model';
import { GameServerStatusComponent, GameServerStatusComponentSchema } from './model';

export class GameServerStatusComponentMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<GameServerStatusComponentSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      current: chance.integer({ min: 0 }),
      name: GameServerStatusComponentName.Application,
      phase: GameServerStatusPhase.Running,
      total: chance.integer({ min: 0 }),
    };

    return new GameServerStatusComponent({ ...defaults, ...params });
  }
}

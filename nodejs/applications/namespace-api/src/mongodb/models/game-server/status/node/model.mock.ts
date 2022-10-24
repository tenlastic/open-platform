import { Chance } from 'chance';

import { GameServerStatusComponentName, GameServerStatusPhase } from '../model';
import { GameServerStatusNode, GameServerStatusNodeSchema } from './model';

const chance = new Chance();

export class GameServerStatusNodeMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<GameServerStatusNodeSchema> = {}) {
    const defaults = {
      component: GameServerStatusComponentName.Application,
      container: chance.hash(),
      phase: GameServerStatusPhase.Running,
      pod: chance.hash(),
    };

    return new GameServerStatusNode({ ...defaults, ...params });
  }
}

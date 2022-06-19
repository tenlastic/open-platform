import { GameServerStatusPhase } from '../model';
import { GameServerStatusNode, GameServerStatusNodeSchema } from './model';

export class GameServerStatusNodeMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<GameServerStatusNodeSchema> = {}) {
    const defaults = { phase: GameServerStatusPhase.Running };

    return new GameServerStatusNode({ ...defaults, ...params });
  }
}

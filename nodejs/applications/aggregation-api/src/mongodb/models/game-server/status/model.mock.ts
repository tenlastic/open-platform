import { GameServerStatus, GameServerStatusPhase, GameServerStatusSchema } from './model';

export class GameServerStatusMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<GameServerStatusSchema> = {}) {
    const defaults = { phase: GameServerStatusPhase.Running };

    return new GameServerStatus({ ...defaults, ...params });
  }
}

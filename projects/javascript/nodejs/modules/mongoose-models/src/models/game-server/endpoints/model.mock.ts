import { GameServerEndpoints, GameServerEndpointsSchema } from './model';

export class GameServerEndpointsMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<GameServerEndpointsSchema> = {}) {
    const defaults = {};

    return new GameServerEndpoints({ ...defaults, ...params });
  }
}

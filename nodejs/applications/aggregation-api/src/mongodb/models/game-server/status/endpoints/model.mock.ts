import { GameServerStatusEndpoints, GameServerStatusEndpointsSchema } from './model';

export class GameServerStatusEndpointsMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<GameServerStatusEndpointsSchema> = {}) {
    const defaults = {};

    return new GameServerStatusEndpoints({ ...defaults, ...params });
  }
}

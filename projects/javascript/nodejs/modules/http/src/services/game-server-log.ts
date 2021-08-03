import { apiUrl } from '../api-url';
import { GameServerLogModel } from '../models/game-server-log';
import { BaseService, ServiceEventEmitter } from './base';

export class GameServerLogService {
  public emitter = new ServiceEventEmitter<GameServerLogModel>();
  private baseService = new BaseService<GameServerLogModel>(this.emitter, GameServerLogModel);

  /**
   * Returns an array of Records satisfying the query.
   */
  public async find(gameServerId: string, nodeId: string, query: any) {
    const url = this.getUrl(gameServerId);
    return this.baseService.find(query, `${url}/${nodeId}`);
  }

  /**
   * Returns the base URL for this Model.
   */
  private getUrl(gameServerId: string) {
    return `${apiUrl}/game-servers/${gameServerId}/logs`;
  }
}

export const gameServerLogService = new GameServerLogService();

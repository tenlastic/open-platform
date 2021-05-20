import { apiUrl } from '../api-url';
import { GameServerLogModel } from '../models/game-server-log';
import { BaseService, ServiceEventEmitter } from './base';

export class GameServerLogService {
  public emitter = new ServiceEventEmitter<GameServerLogModel>();
  private baseService = new BaseService<GameServerLogModel>(this.emitter, GameServerLogModel);

  /**
   * Returns the number of Records satisfying the query.
   */
  public async count(gameServerId: string, query: any) {
    const url = this.getUrl(gameServerId);
    return this.baseService.count(query, url);
  }

  /**
   * Creates a Record.
   */
  public async create(gameServerId: string, json: Partial<GameServerLogModel>) {
    const url = this.getUrl(gameServerId);
    return this.baseService.create(json, url);
  }

  /**
   * Deletes a Record.
   */
  public async delete(gameServerId: string, _id: string) {
    const url = this.getUrl(gameServerId);
    return this.baseService.delete(_id, url);
  }

  /**
   * Returns an array of Records satisfying the query.
   */
  public async find(gameServerId: string, query: any) {
    const url = this.getUrl(gameServerId);
    return this.baseService.find(query, url);
  }

  /**
   * Returns a Record by ID.
   */
  public async findOne(gameServerId: string, _id: string) {
    const url = this.getUrl(gameServerId);
    return this.baseService.findOne(_id, url);
  }

  /**
   * Updates a Record.
   */
  public async update(gameServerId: string, _id: string, json: Partial<GameServerLogModel>) {
    const url = this.getUrl(gameServerId);
    return this.baseService.update(_id, json, url);
  }

  /**
   * Returns the base URL for this Model.
   */
  private getUrl(gameServerId: string) {
    return `${apiUrl}/game-servers/${gameServerId}/logs`;
  }
}

export const gameServerLogService = new GameServerLogService();

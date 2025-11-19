import { GameServerModel } from '../models/game-server';
import { ApiService } from './api';
import {
  BaseService,
  BaseServiceCountQuery,
  BaseServiceFindQuery,
  BaseServiceRecordResponse,
} from './base';
import { EnvironmentService } from './environment';

export class GameServerService {
  public get emitter() {
    return this.baseService.emitter;
  }

  private baseService: BaseService<GameServerModel>;

  constructor(private apiService: ApiService, private environmentService: EnvironmentService) {
    this.baseService = new BaseService<GameServerModel>(this.apiService, GameServerModel);
  }

  /**
   * Returns the number of Records satisfying the query.
   */
  public async count(namespaceId: string, query: BaseServiceCountQuery) {
    const url = this.getUrl(namespaceId);
    return this.baseService.count(query, url);
  }

  /**
   * Creates a Record.
   */
  public async create(namespaceId: string, json: Partial<GameServerModel>) {
    const url = this.getUrl(namespaceId);
    return this.baseService.create(json, url);
  }

  /**
   * Deletes a Record.
   */
  public async delete(namespaceId: string, _id: string) {
    const url = this.getUrl(namespaceId);
    return this.baseService.delete(_id, url);
  }

  /**
   * Returns an array of Records satisfying the query.
   */
  public async find(namespaceId: string, query: BaseServiceFindQuery) {
    const url = this.getUrl(namespaceId);
    return this.baseService.find(query, url);
  }

  /**
   * Returns a Record by ID.
   */
  public async findOne(namespaceId: string, _id: string) {
    const url = this.getUrl(namespaceId);
    return this.baseService.findOne(_id, url);
  }

  /**
   * Restarts the Game Server.
   */
  public async restart(namespaceId: string, _id: string) {
    const url = this.getUrl(namespaceId);
    const response = await this.apiService.request<BaseServiceRecordResponse<GameServerModel>>({
      method: 'patch',
      url: `${url}/${_id}/restarted-at`,
    });

    const record = new GameServerModel(response.data.record);
    this.emitter.emit('update', record);

    return record;
  }

  /**
   * Updates a Record.
   */
  public async update(namespaceId: string, _id: string, json: Partial<GameServerModel>) {
    const url = this.getUrl(namespaceId);
    return this.baseService.update(_id, json, url);
  }

  /**
   * Returns the base URL for this Model.
   */
  private getUrl(namespaceId: string) {
    return `${this.environmentService.apiUrl}/namespaces/${namespaceId}/game-servers`;
  }
}

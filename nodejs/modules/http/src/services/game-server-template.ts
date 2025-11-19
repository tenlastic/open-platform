import { GameServerTemplateModel } from '../models/game-server-template';
import { ApiService } from './api';
import { BaseService, BaseServiceCountQuery, BaseServiceFindQuery } from './base';
import { EnvironmentService } from './environment';

export class GameServerTemplateService {
  public get emitter() {
    return this.baseService.emitter;
  }

  private baseService: BaseService<GameServerTemplateModel>;

  constructor(private apiService: ApiService, private environmentService: EnvironmentService) {
    this.baseService = new BaseService<GameServerTemplateModel>(
      this.apiService,
      GameServerTemplateModel,
    );
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
  public async create(namespaceId: string, json: Partial<GameServerTemplateModel>) {
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
   * Updates a Record.
   */
  public async update(namespaceId: string, _id: string, json: Partial<GameServerTemplateModel>) {
    const url = this.getUrl(namespaceId);
    return this.baseService.update(_id, json, url);
  }

  /**
   * Returns the base URL for this Model.
   */
  private getUrl(namespaceId: string) {
    return `${this.environmentService.apiUrl}/namespaces/${namespaceId}/game-server-templates`;
  }
}

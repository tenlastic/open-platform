import { MatchModel } from '../models/match';
import { MatchStore } from '../states/match';
import { ApiService } from './api';
import { BaseService, BaseServiceFindQuery } from './base';
import { EnvironmentService } from './environment';

export class MatchService {
  public get emitter() {
    return this.baseService.emitter;
  }

  private baseService: BaseService<MatchModel>;

  constructor(
    private apiService: ApiService,
    private environmentService: EnvironmentService,
    private matchStore: MatchStore,
  ) {
    this.baseService = new BaseService<MatchModel>(this.apiService, MatchModel, this.matchStore);
  }

  /**
   * Returns the number of Records satisfying the query.
   */
  public async count(namespaceId: string, query: any) {
    const url = this.getUrl(namespaceId);
    return this.baseService.count(query, url);
  }

  /**
   * Creates a Record.
   */
  public async create(namespaceId: string, json: Partial<MatchModel>) {
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
   * Finishes the Match.
   */
  public async finish(namespaceId: string, _id: string) {
    const url = this.getUrl(namespaceId);
    const response = await this.apiService.request({
      method: 'patch',
      url: `${url}/${_id}/finished-at`,
    });

    const record = new MatchModel(response.data.record);
    this.emitter.emit('update', record);
    this.matchStore.upsertMany([record]);

    return record;
  }

  /**
   * Updates a Record.
   */
  public async update(namespaceId: string, _id: string, json: Partial<MatchModel>) {
    const url = this.getUrl(namespaceId);
    return this.baseService.update(_id, json, url);
  }

  /**
   * Returns the base URL for this Model.
   */
  private getUrl(namespaceId: string) {
    return namespaceId
      ? `${this.environmentService.apiUrl}/namespaces/${namespaceId}/matches`
      : `${this.environmentService.apiUrl}/matches`;
  }
}

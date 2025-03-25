import { TeamModel } from '../models/team';
import { TeamStore } from '../states/team';
import { ApiService } from './api';
import { BaseService, BaseServiceFindQuery } from './base';
import { EnvironmentService } from './environment';

export class TeamService {
  public get emitter() {
    return this.baseService.emitter;
  }

  private baseService: BaseService<TeamModel>;

  constructor(
    private apiService: ApiService,
    private environmentService: EnvironmentService,
    private teamStore: TeamStore,
  ) {
    this.baseService = new BaseService<TeamModel>(this.apiService, TeamModel, this.teamStore);
  }

  /**
   * Returns the number of Records satisfying the query.
   */
  public async count(namespaceId: string, query: any) {
    const url = this.getUrl(namespaceId);
    return this.baseService.count(query, url);
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
  public async update(namespaceId: string, _id: string, json: Partial<TeamModel>) {
    const url = this.getUrl(namespaceId);
    return this.baseService.update(_id, json, url);
  }

  /**
   * Returns the base URL for this Model.
   */
  private getUrl(namespaceId: string) {
    return `${this.environmentService.apiUrl}/namespaces/${namespaceId}/teams`;
  }
}

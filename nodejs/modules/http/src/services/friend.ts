import { FriendModel } from '../models/friend';
import { FriendStore } from '../states/friend';
import { ApiService } from './api';
import { BaseService, BaseServiceFindQuery } from './base';
import { EnvironmentService } from './environment';

export class FriendService {
  public get emitter() {
    return this.baseService.emitter;
  }

  private baseService: BaseService<FriendModel>;

  constructor(
    private apiService: ApiService,
    private environmentService: EnvironmentService,
    private friendStore: FriendStore,
  ) {
    this.baseService = new BaseService<FriendModel>(this.apiService, FriendModel, this.friendStore);
  }

  /**
   * Returns the number of Records satisfying the query.
   */
  public async count(query: any) {
    const url = this.getUrl();
    return this.baseService.count(query, url);
  }

  /**
   * Creates a Record.
   */
  public async create(json: Partial<FriendModel>) {
    const url = this.getUrl();
    return this.baseService.create(json, url);
  }

  /**
   * Deletes a Record.
   */
  public async delete(_id: string) {
    const url = this.getUrl();
    return this.baseService.delete(_id, url);
  }

  /**
   * Returns an array of Records satisfying the query.
   */
  public async find(query: BaseServiceFindQuery) {
    const url = this.getUrl();
    return this.baseService.find(query, url);
  }

  /**
   * Returns the base URL for this Model.
   */
  private getUrl() {
    return `${this.environmentService.apiUrl}/friends`;
  }
}

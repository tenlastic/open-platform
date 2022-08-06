import { RefreshTokenModel } from '../models/refresh-token';
import { RefreshTokenStore } from '../states/refresh-token';
import { ApiService } from './api/api';
import { BaseService, BaseServiceFindQuery, ServiceEventEmitter } from './base';
import { EnvironmentService } from './environment';

export class RefreshTokenService {
  public emitter = new ServiceEventEmitter<RefreshTokenModel>();

  private baseService: BaseService<RefreshTokenModel>;

  constructor(
    private apiService: ApiService,
    private environmentService: EnvironmentService,
    private refreshTokenStore: RefreshTokenStore,
  ) {
    this.baseService = new BaseService<RefreshTokenModel>(
      this.apiService,
      this.emitter,
      RefreshTokenModel,
      this.refreshTokenStore,
    );
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
  public async create(json: Partial<RefreshTokenModel>) {
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
   * Returns a Record by ID.
   */
  public async findOne(_id: string) {
    const url = this.getUrl();
    return this.baseService.findOne(_id, url);
  }

  /**
   * Updates a Record.
   */
  public async update(_id: string, json: Partial<RefreshTokenModel>) {
    const url = this.getUrl();
    return this.baseService.update(_id, json, url);
  }

  /**
   * Returns the base URL for this Model.
   */
  private getUrl() {
    return `${this.environmentService.apiUrl}/refresh-tokens`;
  }
}

import { AuthorizationRequestModel } from '../models/authorization-request';
import { AuthorizationRequestStore } from '../states/authorization-request';
import { ApiService } from './api';
import { BaseService, BaseServiceFindQuery } from './base';
import { EnvironmentService } from './environment';

export class AuthorizationRequestService {
  public get emitter() {
    return this.baseService.emitter;
  }

  private baseService: BaseService<AuthorizationRequestModel>;

  constructor(
    private apiService: ApiService,
    private authorizationRequestStore: AuthorizationRequestStore,
    private environmentService: EnvironmentService,
  ) {
    this.baseService = new BaseService<AuthorizationRequestModel>(
      this.apiService,
      AuthorizationRequestModel,
      this.authorizationRequestStore,
    );
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
  public async create(namespaceId: string, json: Partial<AuthorizationRequestModel>) {
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
   * Denies the Authorization Request.
   */
  public async deny(namespaceId: string, _id: string) {
    const url = this.getUrl(namespaceId);
    const response = await this.apiService.request({
      method: 'put',
      url: `${url}/${_id}/denied-at`,
    });

    const record = new AuthorizationRequestModel(response.data.record);
    this.emitter.emit('update', record);
    this.authorizationRequestStore.upsertMany([record]);

    return record;
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
   * Grants the Authorization Request.
   */
  public async grant(namespaceId: string, _id: string) {
    const url = this.getUrl(namespaceId);
    const response = await this.apiService.request({
      method: 'put',
      url: `${url}/${_id}/granted-at`,
    });

    const record = new AuthorizationRequestModel(response.data.record);
    this.emitter.emit('update', record);
    this.authorizationRequestStore.upsertMany([record]);

    return record;
  }

  /**
   * Updates a Record.
   */
  public async update(namespaceId: string, _id: string, json: Partial<AuthorizationRequestModel>) {
    const url = this.getUrl(namespaceId);
    return this.baseService.update(_id, json, url);
  }

  /**
   * Returns the base URL for this Model.
   */
  private getUrl(namespaceId: string) {
    return namespaceId
      ? `${this.environmentService.apiUrl}/namespaces/${namespaceId}/authorization-requests`
      : `${this.environmentService.apiUrl}/authorization-requests`;
  }
}

import { StorefrontModel } from '../models/storefront';
import { StorefrontStore } from '../states/storefront';
import { ApiService } from './api';
import { BaseService, BaseServiceFindQuery } from './base';
import { EnvironmentService } from './environment';

export class StorefrontService {
  public get emitter() {
    return this.baseService.emitter;
  }

  private baseService: BaseService<StorefrontModel>;

  constructor(
    private apiService: ApiService,
    private environmentService: EnvironmentService,
    private storefrontStore: StorefrontStore,
  ) {
    this.baseService = new BaseService<StorefrontModel>(
      this.apiService,
      StorefrontModel,
      this.storefrontStore,
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
  public async create(namespaceId: string, json: Partial<StorefrontModel>) {
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
  public async update(namespaceId: string, _id: string, json: Partial<StorefrontModel>) {
    const url = this.getUrl(namespaceId);
    return this.baseService.update(_id, json, url);
  }

  /**
   * Uploads an image or video for the Storefront.
   */
  public async upload(namespaceId: string, _id: string, key: string, formData: FormData) {
    const url = this.getUrl(namespaceId);
    const response = await this.apiService.request({
      data: formData,
      method: 'post',
      url: `${url}/${_id}/${key}`,
    });

    const record = new StorefrontModel(response.data.record);
    this.emitter.emit('update', record);
    this.storefrontStore.upsert(_id, record);

    return record;
  }

  /**
   * Returns the base URL for this Model.
   */
  private getUrl(namespaceId: string) {
    return `${this.environmentService.apiUrl}/namespaces/${namespaceId}/storefronts`;
  }
}
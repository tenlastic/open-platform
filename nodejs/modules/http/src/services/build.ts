import { BuildModel } from '../models/build';
import { BuildStore } from '../states/build';
import { ApiService } from './api';
import { BaseService, BaseServiceFindQuery } from './base';
import { EnvironmentService } from './environment';

export class BuildService {
  public get emitter() {
    return this.baseService.emitter;
  }

  private baseService: BaseService<BuildModel>;

  constructor(
    private apiService: ApiService,
    private buildStore: BuildStore,
    private environmentService: EnvironmentService,
  ) {
    this.baseService = new BaseService<BuildModel>(this.apiService, BuildModel, this.buildStore);
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
  public async create(
    namespaceId: string,
    formData: FormData,
    options: { onUploadProgress?: (progressEvent: any) => void } = {},
  ) {
    const url = this.getUrl(namespaceId);
    const response = await this.apiService.request({
      data: formData,
      method: 'post',
      onUploadProgress: options?.onUploadProgress,
      url,
    });

    const record = new BuildModel(response.data.record);
    this.emitter.emit('create', record);
    this.buildStore.add(record);

    return record;
  }

  /**
   * Deletes a Record.
   */
  public async delete(namespaceId: string, _id: string) {
    const url = this.getUrl(namespaceId);
    return this.baseService.delete(_id, url);
  }

  /**
   * Downloads a Build as a Blob.
   */
  public download(namespaceId: string, _id: string) {
    const url = this.getUrl(namespaceId);
    return this.apiService.request({
      method: 'get',
      responseType: 'blob',
      url: `${url}/${_id}`,
    });
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
  public async update(namespaceId: string, _id: string, json: Partial<BuildModel>) {
    const url = this.getUrl(namespaceId);
    return this.baseService.update(_id, json, url);
  }

  /**
   * Returns the base URL for this Model.
   */
  private getUrl(namespaceId: string) {
    return `${this.environmentService.apiUrl}/namespaces/${namespaceId}/builds`;
  }
}

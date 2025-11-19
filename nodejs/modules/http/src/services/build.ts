import { AxiosProgressEvent, AxiosRequestConfig, AxiosRequestTransformer } from 'axios';

import { BuildModel } from '../models/build';
import { ApiService } from './api';
import {
  BaseService,
  BaseServiceCountQuery,
  BaseServiceFindQuery,
  BaseServiceRecordResponse,
} from './base';
import { EnvironmentService } from './environment';

type FormDataFunction = (formData?: FormData) => FormData;

export class BuildService {
  public get emitter() {
    return this.baseService.emitter;
  }

  private baseService: BaseService<BuildModel>;

  constructor(private apiService: ApiService, private environmentService: EnvironmentService) {
    this.baseService = new BaseService<BuildModel>(this.apiService, BuildModel);
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
  public async create(
    namespaceId: string,
    formData: FormData | FormDataFunction,
    options: { onUploadProgress?: (progressEvent: AxiosProgressEvent) => void } = {},
  ) {
    const url = this.getUrl(namespaceId);
    const config: AxiosRequestConfig = {
      method: 'post',
      onUploadProgress: options?.onUploadProgress,
      url,
    };

    if (formData.constructor.name === 'FormData') {
      config.data = formData;
    } else {
      config.transformRequest = formData as AxiosRequestTransformer;
    }

    const response = await this.apiService.request<BaseServiceRecordResponse<BuildModel>>(config);

    const record = new BuildModel(response.data.record);
    this.emitter.emit('create', record);

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
  public download<T = Blob>(
    namespaceId: string,
    _id: string,
    config: AxiosRequestConfig = { responseType: 'blob' },
  ) {
    const url = this.getUrl(namespaceId);
    return this.apiService.request<T>({ method: 'get', url: `${url}/${_id}/files`, ...config });
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

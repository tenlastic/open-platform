import { EventEmitter, Injectable } from '@angular/core';

import { ApiService, RestParameters } from '@app/core/http/api/api.service';
import { Namespace } from '@app/shared/models';
import { environment } from '@env/environment';

@Injectable()
export class NamespaceService {
  public basePath = environment.namespaceApiBaseUrl;

  public onCreate = new EventEmitter<Namespace>();
  public onDelete = new EventEmitter<Namespace>();
  public onUpdate = new EventEmitter<Namespace>();

  constructor(private apiService: ApiService) {}

  public async create(parameters: Partial<Namespace>): Promise<Namespace> {
    const response = await this.apiService.request('post', this.basePath, parameters);

    const record = new Namespace(response.record);
    this.onCreate.emit(record);

    return record;
  }

  public async delete(_id: string): Promise<Namespace> {
    const response = await this.apiService.request('delete', `${this.basePath}/${_id}`, null);

    const record = new Namespace(response.record);
    this.onDelete.emit(record);

    return record;
  }

  public async find(parameters: RestParameters): Promise<Namespace[]> {
    const response = await this.apiService.request('get', this.basePath, parameters);

    return response.records.map(record => new Namespace(record));
  }

  public async findOne(_id: string): Promise<Namespace> {
    const response = await this.apiService.request('get', `${this.basePath}/${_id}`, null);

    return new Namespace(response.record);
  }

  public async update(parameters: Partial<Namespace>): Promise<Namespace> {
    const response = await this.apiService.request(
      'put',
      `${this.basePath}/${parameters._id}`,
      parameters,
    );

    const record = new Namespace(response.record);
    this.onUpdate.emit(record);

    return record;
  }
}

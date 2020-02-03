import { EventEmitter, Injectable } from '@angular/core';

import { Namespace } from '../../models/namespace';
import { ApiService, RestParameters } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';

@Injectable({ providedIn: 'root' })
export class NamespaceService {
  public basePath: string;
  public emitEvents = true;

  public onCreate = new EventEmitter<Namespace>();
  public onDelete = new EventEmitter<Namespace>();
  public onUpdate = new EventEmitter<Namespace>();

  constructor(private apiService: ApiService, private environmentService: EnvironmentService) {
    this.basePath = this.environmentService.namespaceApiBaseUrl;
  }

  public async create(parameters: Partial<Namespace>): Promise<Namespace> {
    const response = await this.apiService.request('post', this.basePath, parameters);

    const record = new Namespace(response.record);

    if (this.emitEvents) {
      this.onCreate.emit(record);
    }

    return record;
  }

  public async delete(_id: string): Promise<Namespace> {
    const response = await this.apiService.request('delete', `${this.basePath}/${_id}`, null);

    const record = new Namespace(response.record);

    if (this.emitEvents) {
      this.onDelete.emit(record);
    }

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

    if (this.emitEvents) {
      this.onUpdate.emit(record);
    }

    return record;
  }
}

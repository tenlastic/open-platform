import { EventEmitter, Injectable } from '@angular/core';

import { Ignoration } from '../../models/ignoration';
import { ApiService, RestParameters } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';

@Injectable({ providedIn: 'root' })
export class IgnorationService {
  public basePath: string;

  public onCreate = new EventEmitter<Ignoration>();
  public onDelete = new EventEmitter<Ignoration>();
  public onUpdate = new EventEmitter<Ignoration>();

  constructor(private apiService: ApiService, private environmentService: EnvironmentService) {
    this.basePath = this.environmentService.ignorationApiBaseUrl;
  }

  public async count(parameters: RestParameters): Promise<number> {
    const response = await this.apiService.request('get', `${this.basePath}/count`, parameters);

    return response.count;
  }

  public async create(parameters: Partial<Ignoration>): Promise<Ignoration> {
    const response = await this.apiService.request('post', this.basePath, parameters);

    const record = new Ignoration(response.record);
    this.onCreate.emit(record);

    return record;
  }

  public async delete(_id: string): Promise<Ignoration> {
    const response = await this.apiService.request('delete', `${this.basePath}/${_id}`, null);

    const record = new Ignoration(response.record);
    this.onDelete.emit(record);

    return record;
  }

  public async find(parameters: RestParameters): Promise<Ignoration[]> {
    const response = await this.apiService.request('get', this.basePath, parameters);

    return response.records.map(record => new Ignoration(record));
  }
}

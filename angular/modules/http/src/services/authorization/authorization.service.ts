import { EventEmitter, Injectable } from '@angular/core';

import { Authorization } from '../../models/authorization';
import { ApiService, RestParameters } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';

export interface AuthorizationServiceUploadOptions {
  background?: Blob;
  icon?: Blob;
}

@Injectable({ providedIn: 'root' })
export class AuthorizationService {
  public basePath: string;

  public onCreate = new EventEmitter<Authorization>();
  public onDelete = new EventEmitter<Authorization>();
  public onRead = new EventEmitter<Authorization[]>();
  public onUpdate = new EventEmitter<Authorization>();

  constructor(private apiService: ApiService, private environmentService: EnvironmentService) {
    this.basePath = this.environmentService.authorizationApiBaseUrl;
  }

  public async count(parameters: RestParameters): Promise<number> {
    const response = await this.apiService.request('get', `${this.basePath}/count`, parameters);

    return response.count;
  }

  public async create(parameters: Partial<Authorization>): Promise<Authorization> {
    const response = await this.apiService.request('post', this.basePath, parameters);

    const record = new Authorization(response.record);
    this.onCreate.emit(record);

    return record;
  }

  public async delete(_id: string): Promise<Authorization> {
    const response = await this.apiService.request('delete', `${this.basePath}/${_id}`, null);

    const record = new Authorization(response.record);
    this.onDelete.emit(record);

    return record;
  }

  public async find(parameters: RestParameters): Promise<Authorization[]> {
    const response = await this.apiService.request('get', this.basePath, parameters);

    const records = response.records.map((record) => new Authorization(record));
    this.onRead.emit(records);

    return records;
  }

  public async findOne(_id: string): Promise<Authorization> {
    const response = await this.apiService.request('get', `${this.basePath}/${_id}`, null);

    const record = new Authorization(response.record);
    this.onRead.emit([record]);

    return record;
  }

  public async update(parameters: Partial<Authorization>): Promise<Authorization> {
    const response = await this.apiService.request(
      'put',
      `${this.basePath}/${parameters._id}`,
      parameters,
    );

    const record = new Authorization(response.record);
    this.onUpdate.emit(record);

    return record;
  }
}

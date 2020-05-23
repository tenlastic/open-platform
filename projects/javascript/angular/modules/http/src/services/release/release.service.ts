import { EventEmitter, Injectable } from '@angular/core';

import { Release } from '../../models/release';
import { ApiService, RestParameters } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';

@Injectable({ providedIn: 'root' })
export class ReleaseService {
  public basePath: string;

  public onCreate = new EventEmitter<Release>();
  public onDelete = new EventEmitter<Release>();
  public onRead = new EventEmitter<Release[]>();
  public onUpdate = new EventEmitter<Release>();

  constructor(private apiService: ApiService, private environmentService: EnvironmentService) {
    this.basePath = this.environmentService.releaseApiBaseUrl;
  }

  public async create(parameters: Partial<Release>): Promise<Release> {
    const response = await this.apiService.request('post', `${this.basePath}`, parameters);

    const record = new Release(response.record);
    this.onCreate.emit(record);

    return record;
  }

  public async delete(_id: string): Promise<Release> {
    const response = await this.apiService.request('delete', `${this.basePath}/${_id}`, null);

    const record = new Release(response.record);
    this.onDelete.emit(record);

    return record;
  }

  public async find(parameters: RestParameters): Promise<Release[]> {
    const response = await this.apiService.request('get', `${this.basePath}`, parameters);

    const records = response.records.map(record => new Release(record));
    this.onRead.emit(records);

    return records;
  }

  public async findOne(_id: string): Promise<Release> {
    const response = await this.apiService.request('get', `${this.basePath}/${_id}`, null);

    const record = new Release(response.record);
    this.onRead.emit([record]);

    return record;
  }

  public async update(parameters: Partial<Release>): Promise<Release> {
    const response = await this.apiService.request(
      'put',
      `${this.basePath}/${parameters._id}`,
      parameters,
    );

    const record = new Release(response.record);
    this.onUpdate.emit(record);

    return record;
  }
}

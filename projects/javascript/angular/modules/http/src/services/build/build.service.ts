import { EventEmitter, Injectable } from '@angular/core';

import { Build } from '../../models/build';
import { ApiService, RestParameters } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';

@Injectable({ providedIn: 'root' })
export class BuildService {
  public basePath: string;

  public onCreate = new EventEmitter<Build>();
  public onDelete = new EventEmitter<Build>();
  public onRead = new EventEmitter<Build[]>();
  public onUpdate = new EventEmitter<Build>();

  constructor(private apiService: ApiService, private environmentService: EnvironmentService) {
    this.basePath = this.environmentService.buildApiBaseUrl;
  }

  public async create(parameters: Partial<Build>): Promise<Build> {
    const response = await this.apiService.request('post', `${this.basePath}`, parameters);

    const record = new Build(response.record);
    this.onCreate.emit(record);

    return record;
  }

  public async delete(_id: string): Promise<Build> {
    const response = await this.apiService.request('delete', `${this.basePath}/${_id}`, null);

    const record = new Build(response.record);
    this.onDelete.emit(record);

    return record;
  }

  public async find(parameters: RestParameters): Promise<Build[]> {
    const response = await this.apiService.request('get', `${this.basePath}`, parameters);

    const records = response.records.map(record => new Build(record));
    this.onRead.emit(records);

    return records;
  }

  public async findOne(_id: string): Promise<Build> {
    const response = await this.apiService.request('get', `${this.basePath}/${_id}`, null);

    const record = new Build(response.record);
    this.onRead.emit([record]);

    return record;
  }

  public async update(parameters: Partial<Build>): Promise<Build> {
    const response = await this.apiService.request(
      'put',
      `${this.basePath}/${parameters._id}`,
      parameters,
    );

    const record = new Build(response.record);
    this.onUpdate.emit(record);

    return record;
  }
}

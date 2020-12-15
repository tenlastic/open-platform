import { EventEmitter, Injectable } from '@angular/core';

import { Pipeline } from '../../models/pipeline';
import { ApiService, RestParameters } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';

@Injectable({ providedIn: 'root' })
export class PipelineService {
  public basePath: string;

  public onCreate = new EventEmitter<Pipeline>();
  public onDelete = new EventEmitter<Pipeline>();
  public onRead = new EventEmitter<Pipeline[]>();
  public onUpdate = new EventEmitter<Pipeline>();

  constructor(private apiService: ApiService, private environmentService: EnvironmentService) {
    this.basePath = this.environmentService.pipelineApiBaseUrl;
  }

  public async count(parameters: RestParameters): Promise<number> {
    const response = await this.apiService.request('get', `${this.basePath}/count`, parameters);

    return response.count;
  }

  public async create(parameters: Partial<Pipeline>): Promise<Pipeline> {
    const response = await this.apiService.request('post', `${this.basePath}`, parameters);

    const record = new Pipeline(response.record);
    this.onCreate.emit(record);

    return record;
  }

  public async delete(_id: string): Promise<Pipeline> {
    const response = await this.apiService.request('delete', `${this.basePath}/${_id}`, null);

    const record = new Pipeline(response.record);
    this.onDelete.emit(record);

    return record;
  }

  public async find(parameters: RestParameters): Promise<Pipeline[]> {
    const response = await this.apiService.request('get', `${this.basePath}`, parameters);

    const records = response.records.map(record => new Pipeline(record));
    this.onRead.emit(records);

    return records;
  }

  public async findOne(_id: string): Promise<Pipeline> {
    const response = await this.apiService.request('get', `${this.basePath}/${_id}`, null);

    const record = new Pipeline(response.record);
    this.onRead.emit([record]);

    return record;
  }

  public async update(parameters: Partial<Pipeline>): Promise<Pipeline> {
    const response = await this.apiService.request(
      'put',
      `${this.basePath}/${parameters._id}`,
      parameters,
    );

    const record = new Pipeline(response.record);
    this.onUpdate.emit(record);

    return record;
  }
}

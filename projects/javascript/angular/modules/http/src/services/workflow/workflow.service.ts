import { EventEmitter, Injectable } from '@angular/core';

import { Workflow } from '../../models/workflow';
import { ApiService, RestParameters } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';

@Injectable({ providedIn: 'root' })
export class WorkflowService {
  public basePath: string;

  public onCreate = new EventEmitter<Workflow>();
  public onDelete = new EventEmitter<Workflow>();
  public onRead = new EventEmitter<Workflow[]>();
  public onUpdate = new EventEmitter<Workflow>();

  constructor(private apiService: ApiService, private environmentService: EnvironmentService) {
    this.basePath = this.environmentService.workflowApiBaseUrl;
  }

  public async count(parameters: RestParameters): Promise<number> {
    const response = await this.apiService.request('get', `${this.basePath}/count`, parameters);

    return response.count;
  }

  public async create(parameters: Partial<Workflow>): Promise<Workflow> {
    const response = await this.apiService.request('post', `${this.basePath}`, parameters);

    const record = new Workflow(response.record);
    this.onCreate.emit(record);

    return record;
  }

  public async delete(_id: string): Promise<Workflow> {
    const response = await this.apiService.request('delete', `${this.basePath}/${_id}`, null);

    const record = new Workflow(response.record);
    this.onDelete.emit(record);

    return record;
  }

  public async find(parameters: RestParameters): Promise<Workflow[]> {
    const response = await this.apiService.request('get', `${this.basePath}`, parameters);

    const records = response.records.map(record => new Workflow(record));
    this.onRead.emit(records);

    return records;
  }

  public async findOne(_id: string): Promise<Workflow> {
    const response = await this.apiService.request('get', `${this.basePath}/${_id}`, null);

    const record = new Workflow(response.record);
    this.onRead.emit([record]);

    return record;
  }

  public async update(parameters: Partial<Workflow>): Promise<Workflow> {
    const response = await this.apiService.request(
      'put',
      `${this.basePath}/${parameters._id}`,
      parameters,
    );

    const record = new Workflow(response.record);
    this.onUpdate.emit(record);

    return record;
  }
}

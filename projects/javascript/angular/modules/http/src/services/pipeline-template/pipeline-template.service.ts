import { EventEmitter, Injectable } from '@angular/core';

import { PipelineTemplate } from '../../models/pipeline-template';
import { ApiService, RestParameters } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';

@Injectable({ providedIn: 'root' })
export class PipelineTemplateService {
  public basePath: string;

  public onCreate = new EventEmitter<PipelineTemplate>();
  public onDelete = new EventEmitter<PipelineTemplate>();
  public onRead = new EventEmitter<PipelineTemplate[]>();
  public onUpdate = new EventEmitter<PipelineTemplate>();

  constructor(private apiService: ApiService, private environmentService: EnvironmentService) {
    this.basePath = this.environmentService.pipelineTemplateApiBaseUrl;
  }

  public async count(parameters: RestParameters): Promise<number> {
    const response = await this.apiService.request('get', `${this.basePath}/count`, parameters);

    return response.count;
  }

  public async create(parameters: Partial<PipelineTemplate>): Promise<PipelineTemplate> {
    const response = await this.apiService.request('post', `${this.basePath}`, parameters);

    const record = new PipelineTemplate(response.record);
    this.onCreate.emit(record);

    return record;
  }

  public async delete(_id: string): Promise<PipelineTemplate> {
    const response = await this.apiService.request('delete', `${this.basePath}/${_id}`, null);

    const record = new PipelineTemplate(response.record);
    this.onDelete.emit(record);

    return record;
  }

  public async find(parameters: RestParameters): Promise<PipelineTemplate[]> {
    const response = await this.apiService.request('get', `${this.basePath}`, parameters);

    const records = response.records.map(record => new PipelineTemplate(record));
    this.onRead.emit(records);

    return records;
  }

  public async findOne(_id: string): Promise<PipelineTemplate> {
    const response = await this.apiService.request('get', `${this.basePath}/${_id}`, null);

    const record = new PipelineTemplate(response.record);
    this.onRead.emit([record]);

    return record;
  }

  public async update(parameters: Partial<PipelineTemplate>): Promise<PipelineTemplate> {
    const response = await this.apiService.request(
      'put',
      `${this.basePath}/${parameters._id}`,
      parameters,
    );

    const record = new PipelineTemplate(response.record);
    this.onUpdate.emit(record);

    return record;
  }
}

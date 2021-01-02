import { EventEmitter, Injectable } from '@angular/core';

import { WorkflowLog } from '../../models/workflow-log';
import { ApiService, RestParameters } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';

@Injectable({ providedIn: 'root' })
export class WorkflowLogService {
  public basePath: string;

  public onCreate = new EventEmitter<WorkflowLog>();
  public onDelete = new EventEmitter<WorkflowLog>();
  public onRead = new EventEmitter<WorkflowLog[]>();
  public onUpdate = new EventEmitter<WorkflowLog>();

  constructor(private apiService: ApiService, private environmentService: EnvironmentService) {
    this.basePath = this.environmentService.workflowApiBaseUrl;
  }

  public async count(workflowId: string, parameters: RestParameters): Promise<number> {
    const response = await this.apiService.request(
      'get',
      `${this.basePath}/${workflowId}/logs/count`,
      parameters,
    );

    return response.count;
  }

  public async create(workflowId: string, parameters: Partial<WorkflowLog>): Promise<WorkflowLog> {
    const response = await this.apiService.request(
      'post',
      `${this.basePath}/${workflowId}/logs`,
      parameters,
    );

    const record = new WorkflowLog(response.record);
    this.onCreate.emit(record);

    return record;
  }

  public async find(workflowId: string, parameters: RestParameters): Promise<WorkflowLog[]> {
    const response = await this.apiService.request(
      'get',
      `${this.basePath}/${workflowId}/logs`,
      parameters,
    );

    const records = response.records.map(record => new WorkflowLog(record));
    this.onRead.emit(records);

    return records;
  }
}

import { EventEmitter, Injectable } from '@angular/core';

import { Queue } from '../../models/queue';
import { QueueLog } from '../../models/queue-log';
import { ApiService, RestParameters } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';

export interface QueueServiceLogsOptions {
  since?: string;
  tail?: number;
}

@Injectable({ providedIn: 'root' })
export class QueueService {
  public basePath: string;

  public onCreate = new EventEmitter<Queue>();
  public onDelete = new EventEmitter<Queue>();
  public onLogs = new EventEmitter<QueueLog[]>();
  public onRead = new EventEmitter<Queue[]>();
  public onUpdate = new EventEmitter<Queue>();

  constructor(private apiService: ApiService, private environmentService: EnvironmentService) {
    this.basePath = this.environmentService.queueApiBaseUrl;
  }

  public async count(parameters: RestParameters): Promise<number> {
    const response = await this.apiService.request('get', `${this.basePath}/count`, parameters);

    return response.count;
  }

  public async create(parameters: Partial<Queue>): Promise<Queue> {
    const response = await this.apiService.request('post', `${this.basePath}`, parameters);

    const record = new Queue(response.record);
    this.onCreate.emit(record);

    return record;
  }

  public async delete(_id: string): Promise<Queue> {
    const response = await this.apiService.request('delete', `${this.basePath}/${_id}`, null);

    const record = new Queue(response.record);
    this.onDelete.emit(record);

    return record;
  }

  public async find(parameters: RestParameters): Promise<Queue[]> {
    const response = await this.apiService.request('get', `${this.basePath}`, parameters);

    const records = response.records.map(record => new Queue(record));
    this.onRead.emit(records);

    return records;
  }

  public async findOne(_id: string): Promise<Queue> {
    const response = await this.apiService.request('get', `${this.basePath}/${_id}`, null);

    const record = new Queue(response.record);
    this.onRead.emit([record]);

    return record;
  }

  public async logs(
    _id: string,
    nodeId: string,
    parameters?: QueueServiceLogsOptions,
  ): Promise<QueueLog[]> {
    const response = await this.apiService.request(
      'get',
      `${this.basePath}/${_id}/logs/${nodeId}`,
      parameters,
    );

    const records = response.records.map(
      record => new QueueLog({ ...record, nodeId, queueId: _id }),
    );
    this.onLogs.emit(records);

    return records;
  }

  public async update(parameters: Partial<Queue>): Promise<Queue> {
    const response = await this.apiService.request(
      'put',
      `${this.basePath}/${parameters._id}`,
      parameters,
    );

    const record = new Queue(response.record);
    this.onUpdate.emit(record);

    return record;
  }
}

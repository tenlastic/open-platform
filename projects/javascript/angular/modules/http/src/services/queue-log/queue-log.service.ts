import { EventEmitter, Injectable } from '@angular/core';

import { QueueLog } from '../../models/queue-log';
import { ApiService, RestParameters } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';

@Injectable({ providedIn: 'root' })
export class QueueLogService {
  public basePath: string;

  public onCreate = new EventEmitter<QueueLog>();
  public onDelete = new EventEmitter<QueueLog>();
  public onRead = new EventEmitter<QueueLog[]>();
  public onUpdate = new EventEmitter<QueueLog>();

  constructor(private apiService: ApiService, private environmentService: EnvironmentService) {
    this.basePath = this.environmentService.queueApiBaseUrl;
  }

  public async count(queueId: string, parameters: RestParameters): Promise<number> {
    const response = await this.apiService.request(
      'get',
      `${this.basePath}/${queueId}/logs/count`,
      parameters,
    );

    return response.count;
  }

  public async create(queueId: string, parameters: Partial<QueueLog>): Promise<QueueLog> {
    const response = await this.apiService.request(
      'post',
      `${this.basePath}/${queueId}/logs`,
      parameters,
    );

    const record = new QueueLog(response.record);
    this.onCreate.emit(record);

    return record;
  }

  public async find(queueId: string, parameters: RestParameters): Promise<QueueLog[]> {
    const response = await this.apiService.request(
      'get',
      `${this.basePath}/${queueId}/logs`,
      parameters,
    );

    const records = response.records.map(record => new QueueLog(record));
    this.onRead.emit(records);

    return records;
  }
}

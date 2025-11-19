import { EventEmitter } from 'events';
import TypedEmitter from 'typed-emitter';

import { QueueLogModel } from '../models/queue-log';
import { ApiService } from './api';
import { BaseServiceRecordsResponse, ServiceEvents } from './base';
import { EnvironmentService } from './environment';

export interface QueueLogsQuery {
  since?: string;
  tail?: number;
}

export class QueueLogService {
  public emitter = new EventEmitter() as TypedEmitter<ServiceEvents<QueueLogModel>>;

  constructor(private apiService: ApiService, private environmentService: EnvironmentService) {}

  /**
   * Returns an array of Records satisfying the query.
   */
  public async find(
    namespaceId: string,
    queueId: string,
    pod: string,
    container: string,
    query: QueueLogsQuery,
  ) {
    const url = this.getUrl(namespaceId, queueId);
    const response = await this.apiService.request<BaseServiceRecordsResponse<QueueLogModel>>({
      method: 'get',
      params: query,
      url: `${url}/${pod}/${container}`,
    });

    const records = response.data.records.map(
      (record) => new QueueLogModel({ ...record, container, queueId, pod }),
    );
    this.emitter.emit('find', records);

    return records;
  }

  /**
   * Returns the base URL for this Model.
   */
  private getUrl(namespaceId: string, queueId: string) {
    return `${this.environmentService.apiUrl}/namespaces/${namespaceId}/queues/${queueId}/logs`;
  }
}

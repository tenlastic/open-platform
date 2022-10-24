import { QueueLogModel } from '../models/queue-log';
import { QueueLogStore } from '../states/queue-log';
import { ApiService } from './api';
import { EnvironmentService } from './environment';

export interface QueueLogsQuery {
  since?: string;
  tail?: number;
}

export class QueueLogService {
  constructor(
    private apiService: ApiService,
    private environmentService: EnvironmentService,
    private queueLogStore: QueueLogStore,
  ) {}

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
    const response = await this.apiService.request({
      method: 'get',
      params: query,
      url: `${url}/${pod}/${container}`,
    });

    const records = response.data.records.map(
      (record) => new QueueLogModel({ ...record, container, queueId, pod }),
    );
    this.queueLogStore.upsertMany(records);

    return records;
  }

  /**
   * Returns the base URL for this Model.
   */
  private getUrl(namespaceId: string, queueId: string) {
    return `${this.environmentService.apiUrl}/namespaces/${namespaceId}/queues/${queueId}/logs`;
  }
}

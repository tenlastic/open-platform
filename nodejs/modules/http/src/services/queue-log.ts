import { apiUrl } from '../api-url';
import { QueueLogModel } from '../models/queue-log';
import { BaseService, ServiceEventEmitter } from './base';

export class QueueLogService {
  public emitter = new ServiceEventEmitter<QueueLogModel>();
  private baseService = new BaseService<QueueLogModel>(this.emitter, QueueLogModel);

  /**
   * Returns an array of Records satisfying the query.
   */
  public async find(namespaceId: string, queueId: string, nodeId: string, query: any) {
    const url = this.getUrl(namespaceId, queueId);
    return this.baseService.find(query, `${url}/${nodeId}`);
  }

  /**
   * Returns the base URL for this Model.
   */
  private getUrl(namespaceId: string, queueId: string) {
    return `${apiUrl}/namespaces/${namespaceId}/queues/${queueId}/logs`;
  }
}

export const queueLogService = new QueueLogService();

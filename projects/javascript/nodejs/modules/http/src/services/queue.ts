import { apiUrl } from '../api-url';
import { QueueModel } from '../models';
import { queueStore } from '../stores';
import { BaseService } from './base';

export class QueueService extends BaseService<QueueModel> {
  protected store = queueStore;
  protected get url() {
    return `${apiUrl}/queues`;
  }
}

export const queueService = new QueueService();

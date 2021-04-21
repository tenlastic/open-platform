import { QueueModel } from '../models';
import { queueStore } from '../stores';
import { BaseService } from './base';

const apiRootUrl = process.env.API_URL;

export class QueueService extends BaseService<QueueModel> {
  protected store = queueStore;
  protected url = `${apiRootUrl}/queues`;
}

export const queueService = new QueueService();

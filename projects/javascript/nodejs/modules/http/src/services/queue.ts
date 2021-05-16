import { QueueModel } from '../models';
import { queueStore } from '../stores';
import { BaseService } from './base';

const apiUrl = process.env.API_URL;

export class QueueService extends BaseService<QueueModel> {
  protected store = queueStore;
  protected url = `${apiUrl}/queues`;
}

export const queueService = new QueueService();

import { QueueModel } from '../models';
import { QueueService } from '../services';
import { BaseState } from './base';

export class QueueState extends BaseState<QueueModel, QueueService> {
  constructor(service: QueueService) {
    super('_id', service);
  }
}

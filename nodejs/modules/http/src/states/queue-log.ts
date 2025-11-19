import { QueueLogModel } from '../models';
import { QueueLogService } from '../services';
import { BaseState } from './base';

export class QueueLogState extends BaseState<QueueLogModel, QueueLogService> {
  constructor(service: QueueLogService) {
    super('unix', service);
  }
}

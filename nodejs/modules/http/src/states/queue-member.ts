import { QueueMemberModel } from '../models';
import { QueueMemberService } from '../services';
import { BaseState } from './base';

export class QueueMemberState extends BaseState<QueueMemberModel, QueueMemberService> {
  constructor(service: QueueMemberService) {
    super('_id', service);
  }
}

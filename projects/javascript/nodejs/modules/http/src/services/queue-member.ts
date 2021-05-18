import { apiUrl } from '../api-url';
import { QueueMemberModel } from '../models';
import { queueMemberStore } from '../stores';
import { BaseService } from './base';

export class QueueMemberService extends BaseService<QueueMemberModel> {
  protected store = queueMemberStore;
  protected get url() {
    return `${apiUrl}/queue-members`;
  }
}

export const queueMemberService = new QueueMemberService();

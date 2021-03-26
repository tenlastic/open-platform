import { QueueMemberModel } from '../models';
import { queueMemberStore } from '../stores';
import { BaseService } from './base';

const apiRootUrl = process.env.API_ROOT_URL;

export class QueueMemberService extends BaseService<QueueMemberModel> {
  protected store = queueMemberStore;
  protected url = `${apiRootUrl}/queue-members`;
}

export const queueMemberService = new QueueMemberService();

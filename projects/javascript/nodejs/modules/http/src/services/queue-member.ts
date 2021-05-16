import { QueueMemberModel } from '../models';
import { queueMemberStore } from '../stores';
import { BaseService } from './base';

const apiUrl = process.env.API_URL;

export class QueueMemberService extends BaseService<QueueMemberModel> {
  protected store = queueMemberStore;
  protected url = `${apiUrl}/queue-members`;
}

export const queueMemberService = new QueueMemberService();

import { BaseModel } from './base';

export interface QueueMemberModel extends BaseModel {
  userIds?: string[];
}

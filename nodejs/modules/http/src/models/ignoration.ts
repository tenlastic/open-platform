import { userQuery } from '../stores/user';
import { BaseModel } from './base';

export class IgnorationModel extends BaseModel {
  public get fromUser() {
    return userQuery.getEntity(this.fromUserId);
  }
  public fromUserId: string;
  public get toUser() {
    return userQuery.getEntity(this.toUserId);
  }
  public toUserId: string;

  constructor(parameters: Partial<IgnorationModel> = {}) {
    super(parameters);
  }
}

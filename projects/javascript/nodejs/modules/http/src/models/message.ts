import { groupQuery } from '../stores/group';
import { userQuery } from '../stores/user';
import { BaseModel } from './base';

export class MessageModel extends BaseModel {
  public body: string;
  public get fromUser() {
    return userQuery.getEntity(this.fromUserId);
  }
  public fromUserId: string;
  public readByUserIds: string[];
  public get readByUsers() {
    return this.readByUserIds.map(rbui => userQuery.getEntity(rbui));
  }
  public get toGroup() {
    return groupQuery.getEntity(this.toGroupId);
  }
  public toGroupId: string;
  public get toUser() {
    return userQuery.getEntity(this.toUserId);
  }
  public toUserId: string;

  constructor(parameters: Partial<MessageModel> = {}) {
    super(parameters);
  }
}

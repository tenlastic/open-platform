import { groupQuery } from '../stores/group';
import { userQuery } from '../stores/user';
import { BaseModel } from './base';

export class GroupInvitationModel extends BaseModel {
  public get fromUser() {
    return userQuery.getEntity(this.fromUserId);
  }
  public fromUserId: string;
  public get group() {
    return groupQuery.getEntity(this.groupId);
  }
  public groupId: string;
  public get toUser() {
    return userQuery.getEntity(this.toUserId);
  }
  public toUserId: string;

  constructor(parameters: Partial<GroupInvitationModel> = {}) {
    super(parameters);
  }
}

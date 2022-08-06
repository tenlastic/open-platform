import { BaseModel } from './base';

export class GroupInvitationModel extends BaseModel {
  public fromUserId: string;
  public groupId: string;
  public toUserId: string;

  constructor(parameters?: Partial<GroupInvitationModel>) {
    super(parameters);
  }
}

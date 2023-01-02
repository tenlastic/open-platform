import { BaseModel } from './base';

export class GroupInvitationModel extends BaseModel {
  public expiresAt: Date;
  public fromUserId: string;
  public groupId: string;
  public toUserId: string;

  constructor(parameters?: Partial<GroupInvitationModel>) {
    super(parameters);

    this.expiresAt = parameters?.expiresAt ? new Date(parameters.expiresAt) : null;
  }
}

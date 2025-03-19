import { BaseModel } from './base';

export class GroupInvitationModel extends BaseModel {
  public expiresAt: Date;
  public fromUserId: string;
  public groupId: string;
  public namespaceId: string;
  public toUserId: string;

  constructor(parameters?: Partial<GroupInvitationModel>) {
    super(parameters);

    if (parameters?.expiresAt) {
      this.expiresAt = new Date(parameters.expiresAt);
    }
  }
}

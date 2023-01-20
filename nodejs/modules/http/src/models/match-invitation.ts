import { BaseModel } from './base';

export class MatchInvitationModel extends BaseModel {
  public acceptedAt: Date;
  public expiresAt: Date;
  public matchId: string;
  public namespaceId: string;
  public queueId: string;
  public userId: string;

  constructor(parameters?: Partial<MatchInvitationModel>) {
    super(parameters);

    if (parameters?.acceptedAt) {
      this.acceptedAt = new Date(parameters.acceptedAt);
    }
    if (parameters?.expiresAt) {
      this.expiresAt = new Date(parameters.expiresAt);
    }
  }
}

import { BaseModel } from './base';

export class MatchInvitationModel extends BaseModel {
  public acceptedAt: Date;
  public expiresAt: Date;
  public matchId: string;
  public namespaceId: string;
  public userId: string;

  constructor(parameters?: Partial<MatchInvitationModel>) {
    super(parameters);

    this.acceptedAt = parameters?.acceptedAt ? new Date(parameters.acceptedAt) : null;
    this.expiresAt = parameters?.expiresAt ? new Date(parameters.expiresAt) : null;
  }
}

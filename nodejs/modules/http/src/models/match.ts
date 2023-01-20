import { BaseModel } from './base';

export namespace IMatch {
  export interface Team {
    userIds?: string[];
  }
}

export class MatchModel extends BaseModel {
  public confirmationExpiresAt: Date;
  public confirmedUserIds: string;
  public finishedAt: Date;
  public gameServerTemplateId: string;
  public invitationSeconds: number;
  public namespaceId: string;
  public queueId: string;
  public startedAt: Date;
  public teams: IMatch.Team[];
  public get userIds(): string[] {
    return this.teams.reduce((previous, current) => [...previous, ...current.userIds], []);
  }

  constructor(parameters?: Partial<MatchModel>) {
    super(parameters);

    if (parameters?.confirmationExpiresAt) {
      this.confirmationExpiresAt = new Date(parameters.confirmationExpiresAt);
    }
    if (parameters?.finishedAt) {
      this.finishedAt = new Date(parameters.finishedAt);
    }
    if (parameters?.startedAt) {
      this.startedAt = new Date(parameters.startedAt);
    }
  }
}

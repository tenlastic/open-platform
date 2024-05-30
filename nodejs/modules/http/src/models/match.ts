import { BaseModel } from './base';

export namespace IMatch {
  export interface Team {
    userIds?: string[];
  }
}

export class MatchModel extends BaseModel {
  public acceptedUserIds: string[];
  public declinedUserIds: string[];
  public finishedAt: Date;
  public gameServerTemplateId: string;
  public invitationSeconds: number;
  public invitationsExpireAt: Date;
  public namespaceId: string;
  public queueId: string;
  public startedAt: Date;
  public teams: IMatch.Team[];
  public get userIds(): string[] {
    return this.teams.reduce((previous, current) => [...previous, ...current.userIds], []);
  }

  constructor(parameters?: Partial<MatchModel>) {
    super(parameters);

    if (parameters?.invitationsExpireAt) {
      this.invitationsExpireAt = new Date(parameters.invitationsExpireAt);
    }
    if (parameters?.finishedAt) {
      this.finishedAt = new Date(parameters.finishedAt);
    }
    if (parameters?.startedAt) {
      this.startedAt = new Date(parameters.startedAt);
    }
  }
}

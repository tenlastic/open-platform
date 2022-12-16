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

    this.confirmationExpiresAt = parameters?.confirmationExpiresAt
      ? new Date(parameters.confirmationExpiresAt)
      : null;
    this.finishedAt = parameters?.finishedAt ? new Date(parameters.finishedAt) : null;
    this.startedAt = parameters?.startedAt ? new Date(parameters.startedAt) : null;
  }
}

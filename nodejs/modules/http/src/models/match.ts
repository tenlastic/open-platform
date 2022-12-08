import { BaseModel } from './base';

export namespace IMatch {
  export interface Team {
    userIds?: string[];
  }
}

export class MatchModel extends BaseModel {
  public namespaceId: string;
  public queueId: string;
  public teams: IMatch.Team[];
  public get userIds() {
    return this.teams.reduce((previous, current) => [...previous, ...current.userIds], []);
  }

  constructor(parameters?: Partial<MatchModel>) {
    super(parameters);
  }
}
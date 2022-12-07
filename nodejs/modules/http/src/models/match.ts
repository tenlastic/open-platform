import { BaseModel } from './base';
import { IQueue } from './queue';

export class MatchModel extends BaseModel {
  public gameServerTemplate: IQueue.GameServerTemplate;
  public namespaceId: string;
  public queueId: string;
  public teams: number;
  public userIds: string[];
  public usersPerTeam: number;

  constructor(parameters?: Partial<MatchModel>) {
    super(parameters);
  }
}

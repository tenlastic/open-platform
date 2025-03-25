import { BaseModel } from './base';

export class TeamModel extends BaseModel {
  public metadata: any;
  public namespaceId: string;
  public queueId: string;
  public rating: number;
  public userIds: string[];

  constructor(parameters?: Partial<TeamModel>) {
    super(parameters);
  }
}

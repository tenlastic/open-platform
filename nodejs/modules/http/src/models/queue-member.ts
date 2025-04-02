import { BaseModel } from './base';

export namespace IQueueMember {
  export interface Team {
    rating?: number;
    teamId?: string;
  }
}

export class QueueMemberModel extends BaseModel {
  public groupId: string;
  public matchedAt: Date;
  public namespaceId: string;
  public queueId: string;
  public team: IQueueMember.Team;
  public userId: string;
  public userIds: string[];

  constructor(parameters?: Partial<QueueMemberModel>) {
    super(parameters);

    if (parameters?.matchedAt) {
      this.matchedAt = new Date(parameters.matchedAt);
    }
  }
}

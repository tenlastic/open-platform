import { BaseModel } from './base';

export class QueueMemberModel extends BaseModel {
  public groupId: string;
  public matchedAt: Date;
  public namespaceId: string;
  public queueId: string;
  public userId: string;
  public userIds: string[];
  public webSocketId: string;

  constructor(parameters?: Partial<QueueMemberModel>) {
    super(parameters);

    this.matchedAt = parameters?.matchedAt ? new Date(parameters.matchedAt) : null;
  }
}

import { BaseModel } from './base';

export class QueueMemberModel extends BaseModel {
  public _id: string;
  public createdAt: Date;
  public groupId: string;
  public namespaceId: string;
  public queueId: string;
  public updatedAt: Date;
  public userId: string;
  public userIds: string[];
  public webSocketId: string;

  constructor(parameters?: Partial<QueueMemberModel>) {
    super(parameters);
  }
}

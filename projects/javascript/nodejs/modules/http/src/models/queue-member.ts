import { namespaceQuery } from '../stores/namespace';
import { queueQuery } from '../stores/queue';
import { userQuery } from '../stores/user';
import { BaseModel } from './base';

export class QueueMemberModel extends BaseModel {
  public _id: string;
  public createdAt: Date;
  public groupId: string;
  public get namespace() {
    return namespaceQuery.getEntity(this.namespaceId);
  }
  public namespaceId: string;
  public get queue() {
    return queueQuery.getEntity(this.queueId);
  }
  public queueId: string;
  public updatedAt: Date;
  public get user() {
    return userQuery.getEntity(this.userId);
  }
  public get users() {
    return this.userIds.map(ui => userQuery.getEntity(ui));
  }
  public userId: string;
  public userIds: string[];
  public webSocketId: string;

  constructor(parameters: Partial<QueueMemberModel> = {}) {
    super(parameters);
  }
}

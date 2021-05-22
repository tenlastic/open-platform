import { Model } from './model';
import { Namespace } from './namespace';
import { Queue } from './queue';
import { User } from './user';

export class QueueMember extends Model {
  public _id: string;
  public createdAt: Date;
  public groupId: string;
  public namespace: Namespace;
  public namespaceId: string;
  public queue: Queue;
  public queueId: string;
  public updatedAt: Date;
  public user: User;
  public userId: string;
  public webSocketId: string;

  constructor(params: Partial<QueueMember> = {}) {
    super(params);
  }
}

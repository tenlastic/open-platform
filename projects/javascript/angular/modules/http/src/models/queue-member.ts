import { Model } from './model';
import { Queue } from './queue';
import { User } from './user';

export class QueueMember extends Model {
  public _id: string;
  public createdAt: Date;
  public queue: Queue;
  public queueId: string;
  public updatedAt: Date;
  public user: User;
  public userId: string;

  constructor(params: Partial<QueueMember> = {}) {
    super(params);
  }
}
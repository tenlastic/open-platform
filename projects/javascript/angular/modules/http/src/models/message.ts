import { Model } from './model';
import { User } from './user';

export class Message extends Model {
  public body: string;
  public fromUser: User;
  public fromUserId: string;
  public readAt: Date;
  public toUser: User;
  public toUserId: string;

  constructor(params?: Partial<Message>) {
    super(params);

    this.readAt = params.readAt ? new Date(params.readAt) : null;
  }
}

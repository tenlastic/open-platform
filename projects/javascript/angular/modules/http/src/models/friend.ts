import { Model } from './model';
import { User } from './user';

export class Friend extends Model {
  public fromUser: User;
  public fromUserId: string;
  public toUser: User;
  public toUserId: string;

  constructor(params?: Partial<Friend>) {
    super(params);
  }
}

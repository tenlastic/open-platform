import { Model } from './model';
import { User } from './user';

export class Ignoration extends Model {
  public fromUser: User;
  public fromUserId: string;
  public toUser: User;
  public toUserId: string;

  constructor(params?: Partial<Ignoration>) {
    super(params);
  }
}

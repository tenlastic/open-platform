import { Model } from './model';
import { Group } from './group';
import { User } from './user';

export class Message extends Model {
  public body: string;
  public fromUser: User;
  public fromUserId: string;
  public readByUserIds: string[];
  public readByUsers: string;
  public toGroup: Group;
  public toGroupId: string;
  public toUser: User;
  public toUserId: string;

  constructor(params?: Partial<Message>) {
    super(params);
  }
}

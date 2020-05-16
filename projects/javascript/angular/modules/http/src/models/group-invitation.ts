import { Group } from './group';
import { Model } from './model';
import { User } from './user';

export class GroupInvitation extends Model {
  public fromUser: User;
  public fromUserId: string;
  public group: Group;
  public groupId: string;
  public toUser: User;
  public toUserId: string;

  constructor(params?: Partial<GroupInvitation>) {
    super(params);
  }
}

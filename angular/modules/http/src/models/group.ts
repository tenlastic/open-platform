import { Model } from './model';
import { User } from './user';

export class Group extends Model {
  public isOpen: boolean;
  public userIds: string[];
  public users: User[];

  constructor(params?: Partial<Group>) {
    super(params);
  }
}

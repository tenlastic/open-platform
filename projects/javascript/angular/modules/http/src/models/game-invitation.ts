import { Model } from './model';
import { Namespace } from './namespace';
import { User } from './user';

export class GameInvitation extends Model {
  public fromUser: User;
  public fromUserId: string;
  public namespace: Namespace;
  public namespaceId: string;
  public toUser: User;
  public toUserId: string;

  constructor(params?: Partial<GameInvitation>) {
    super(params);

    this.fromUser = this.fromUser ? new User(this.fromUser) : null;
    this.namespace = this.namespace ? new Namespace(this.namespace) : null;
    this.toUser = this.toUser ? new User(this.toUser) : null;
  }
}

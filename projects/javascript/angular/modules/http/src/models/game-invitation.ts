import { Model } from './model';
import { Namespace } from './namespace';
import { User } from './user';

export class GameInvitation extends Model {
  public fromUser: User;
  public namespace: Namespace;
  public namespaceId: string;
  public user: User;
  public userId: string;

  constructor(params?: Partial<GameInvitation>) {
    super(params);

    this.namespace = this.namespace ? new Namespace(this.namespace) : null;
    this.user = this.user ? new User(this.user) : null;
  }
}

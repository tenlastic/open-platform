import { Model } from './model';
import { Game } from './game';
import { Namespace } from './namespace';
import { User } from './user';

export class GameInvitation extends Model {
  public game: Game;
  public gameId: string;
  public namespace: Namespace;
  public namespaceId: string;
  public user: User;
  public userId: string;

  constructor(params?: Partial<GameInvitation>) {
    super(params);

    this.game = this.game ? new Game(this.game) : null;
    this.namespace = this.namespace ? new Namespace(this.namespace) : null;
    this.user = this.user ? new User(this.user) : null;
  }
}

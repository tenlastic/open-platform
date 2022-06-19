import { Model } from './model';
import { Game } from './game';
import { Namespace } from './namespace';
import { User } from './user';

export namespace IGameAuthorization {
  export enum GameAuthorizationStatus {
    Granted = 'granted',
    Pending = 'pending',
    Revoked = 'revoked',
  }
}

export class GameAuthorization extends Model {
  public game: Game;
  public gameId: string;
  public namespace: Namespace;
  public namespaceId: string;
  public status: IGameAuthorization.GameAuthorizationStatus;
  public user: User;
  public userId: string;

  constructor(params?: Partial<GameAuthorization>) {
    super(params);

    this.game = this.game ? new Game(this.game) : null;
    this.namespace = this.namespace ? new Namespace(this.namespace) : null;
    this.user = this.user ? new User(this.user) : null;
  }
}

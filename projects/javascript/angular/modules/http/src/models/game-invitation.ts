import { Game } from './game';
import { Model } from './model';
import { User } from './user';

export class GameInvitation extends Model {
  public fromUser: User;
  public fromUserId: string;
  public game: Game;
  public gameId: string;
  public toUser: User;
  public toUserId: string;

  constructor(params?: Partial<GameInvitation>) {
    super(params);

    this.fromUser = this.fromUser ? new User(this.fromUser) : null;
    this.game = this.game ? new Game(this.game) : null;
    this.toUser = this.toUser ? new User(this.toUser) : null;
  }
}

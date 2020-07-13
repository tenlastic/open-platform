import { GameServer } from './game-server';
import { Model } from './model';

export class Log extends Model {
  public body: string;
  public gameServer: GameServer;
  public gameServerId: string;

  constructor(params?: Partial<Log>) {
    super(params);

    this.gameServer = this.gameServer ? new GameServer(this.gameServer) : null;
  }
}

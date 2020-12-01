import { GameServer } from './game-server';
import { Model } from './model';

export class GameServerLog extends Model {
  public body: string;
  public gameServer: GameServer;
  public gameServerId: string;
  public unix: number;

  constructor(params?: Partial<GameServerLog>) {
    super(params);

    this.gameServer = this.gameServer ? new GameServer(this.gameServer) : null;
  }
}

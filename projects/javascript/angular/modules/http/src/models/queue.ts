import { Model } from './model';
import { Game } from './game';
import { GameServer } from './game-server';

export class Queue extends Model {
  public _id: string;
  public createdAt: Date;
  public description: string;
  public game: Game;
  public gameId: string;
  public gameServerTemplate: Partial<GameServer>;
  public metadata: any;
  public name: string;
  public namespaceId: string;
  public usersPerTeam: number;
  public teams: number;
  public updatedAt: Date;

  constructor(params: Partial<Queue> = {}) {
    super(params);

    this.game = this.game ? new Game(this.game) : null;
  }
}

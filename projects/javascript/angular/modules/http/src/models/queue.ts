import { Model } from './model';
import { GameServer } from './game-server';

export class Queue extends Model {
  public _id: string;
  public createdAt: Date;
  public description: string;
  public gameId: string;
  public gameServerTemplate: Partial<GameServer>;
  public name: string;
  public usersPerTeam: number;
  public teams: number;
  public updatedAt: Date;

  constructor(params: Partial<Queue> = {}) {
    super(params);
  }
}

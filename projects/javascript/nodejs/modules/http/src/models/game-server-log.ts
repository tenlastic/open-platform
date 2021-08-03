import { gameServerQuery } from '../stores/game-server';
import { BaseModel } from './base';

export class GameServerLogModel extends BaseModel {
  public body: string;
  public get gameServer() {
    return gameServerQuery.getEntity(this.gameServerId);
  }
  public gameServerId: string;
  public nodeId: string;
  public unix: number;

  constructor(parameters: Partial<GameServerLogModel> = {}) {
    super(parameters);
  }
}

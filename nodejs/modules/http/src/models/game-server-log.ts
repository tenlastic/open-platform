import { BaseModel } from './base';

export class GameServerLogModel extends BaseModel {
  public body: string;
  public gameServerId: string;
  public nodeId: string;
  public unix: number;

  constructor(parameters?: Partial<GameServerLogModel>) {
    super(parameters);
  }
}

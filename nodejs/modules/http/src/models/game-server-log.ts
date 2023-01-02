import { BaseModel } from './base';

export class GameServerLogModel extends BaseModel {
  public body: string;
  public container: string;
  public gameServerId: string;
  public pod: string;
  public unix: number;

  constructor(parameters?: Partial<GameServerLogModel>) {
    super(parameters);
  }
}

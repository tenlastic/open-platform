import { Model } from './model';

export class GameServerLog extends Model {
  public body: string;
  public gameServerId: string;
  public nodeId: string;
  public unix: number;

  constructor(params?: Partial<GameServerLog>) {
    super(params);
  }
}

import { BaseLogModel } from './base-log';

export class GameServerLogModel extends BaseLogModel {
  public gameServerId: string;

  constructor(parameters?: Partial<GameServerLogModel>) {
    super(parameters);
  }
}

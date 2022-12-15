import { BaseModel } from './base';

import { IGameServer } from './game-server';

export class GameServerTemplateModel extends BaseModel {
  public buildId: string;
  public cpu: number;
  public description: string;
  public memory: number;
  public metadata: any;
  public name: string;
  public namespaceId: string;
  public persistent: boolean;
  public ports: IGameServer.Port[];
  public preemptible: boolean;
  public probes: IGameServer.Probes;

  constructor(parameters?: Partial<GameServerTemplateModel>) {
    super(parameters);
  }
}

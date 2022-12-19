import { BaseModel } from './base';

import { GameServerModel, IGameServer } from './game-server';

export class GameServerTemplateModel extends BaseModel {
  public buildId: string;
  public cpu: number;
  public description: string;
  public memory: number;
  public metadata: any;
  public name: string;
  public namespaceId: string;
  public ports: IGameServer.Port[];
  public preemptible: boolean;
  public probes: IGameServer.Probes;

  constructor(parameters?: Partial<GameServerTemplateModel>) {
    super(parameters);
  }

  public toGameServer() {
    return new GameServerModel({
      buildId: this.buildId,
      cpu: this.cpu,
      description: this.description,
      memory: this.memory,
      metadata: this.metadata,
      name: this.name,
      namespaceId: this.namespaceId,
      ports: this.ports,
      preemptible: this.preemptible,
      probes: this.probes,
    });
  }
}

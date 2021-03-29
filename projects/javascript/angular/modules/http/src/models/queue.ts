import { Model } from './model';
import { Build } from './build';
import { Game } from './game';
import { GameServer } from './game-server';

export namespace IQueue {
  export const Cpu = [
    { label: '0.1', value: 0.1 },
    { label: '0.25', value: 0.25 },
    { label: '0.5', value: 0.5 },
  ];
  export const Memory = [
    { label: '100 MB', value: 100 * 1000 * 1000 },
    { label: '250 MB', value: 250 * 1000 * 1000 },
    { label: '500 MB', value: 500 * 1000 * 1000 },
    { label: '1 GB', value: 100 * 1000 * 1000 },
    { label: '2.5 GB', value: 250 * 1000 * 1000 },
    { label: '5 GB', value: 500 * 1000 * 1000 },
  ];

  export interface Status {
    nodes?: StatusNode;
    phase: string;
  }

  export interface StatusNode {
    name: string;
    phase: string;
  }
}

export class Queue extends Model {
  public _id: string;
  public build: Build;
  public buildId: string;
  public cpu: number;
  public createdAt: Date;
  public description: string;
  public game: Game;
  public gameId: string;
  public gameServerTemplate: Partial<GameServer>;
  public isPreemptible: boolean;
  public memory: number;
  public metadata: any;
  public name: string;
  public namespaceId: string;
  public status: IQueue.Status;
  public teams: number;
  public updatedAt: Date;
  public usersPerTeam: number;

  constructor(params: Partial<Queue> = {}) {
    super(params);

    this.build = this.build ? new Build(this.build) : null;
    this.game = this.game ? new Game(this.game) : null;
  }

  public static isRestartRequired(fields: string[]) {
    const immutableFields = ['buildId', 'cpu', 'isPreemptible', 'memory', 'metadata'];
    return immutableFields.some(i => fields.includes(i));
  }
}

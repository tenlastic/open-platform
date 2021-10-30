import { Model } from './model';
import { Build } from './build';
import { Game } from './game';
import { GameServer } from './game-server';

export namespace IQueue {
  export const Cpu = [
    { label: '0.1', value: 0.1 },
    { label: '0.25', value: 0.25 },
    { label: '0.5', value: 0.5 },
    { label: '1', value: 1 },
  ];
  export const Memory = [
    { label: '100 MB', value: 100 * 1000 * 1000 },
    { label: '250 MB', value: 250 * 1000 * 1000 },
    { label: '500 MB', value: 500 * 1000 * 1000 },
    { label: '1 GB', value: 1 * 1000 * 1000 * 1000 },
    { label: '2.5 GB', value: 2.5 * 1000 * 1000 * 1000 },
    { label: '5 GB', value: 5 * 1000 * 1000 * 1000 },
  ];
  export const Replicas = [
    { label: '1', value: 1 },
    { label: '3', value: 3 },
    { label: '5', value: 5 },
  ];

  export interface GameServerTemplate {
    buildId: string;
    cpu: number;
    memory: number;
    metadata: any;
    preemptible: boolean;
  }

  export interface Status {
    components?: StatusComponent[];
    nodes?: StatusNode[];
    phase: string;
    version?: string;
  }

  export interface StatusComponent {
    current: number;
    name: string;
    phase: string;
    total: number;
  }

  export interface StatusNode {
    _id: string;
    displayName: string;
    phase: string;
  }
}

export class Queue extends Model {
  public build: Build;
  public buildId: string;
  public cpu: number;
  public description: string;
  public game: Game;
  public gameId: string;
  public gameServerTemplate: IQueue.GameServerTemplate;
  public memory: number;
  public metadata: any;
  public name: string;
  public namespaceId: string;
  public preemptible: boolean;
  public replicas: number;
  public restartedAt: Date;
  public status: IQueue.Status;
  public teams: number;
  public usersPerTeam: number;

  constructor(params: Partial<Queue> = {}) {
    super(params);

    this.build = this.build ? new Build(this.build) : null;
    this.game = this.game ? new Game(this.game) : null;
  }

  public static isRestartRequired(fields: string[]) {
    const immutableFields = [
      'buildId',
      'cpu',
      'gameServerTemplate',
      'memory',
      'preemptible',
      'replicas',
      'restartedAt',
      'teams',
      'usersPerTeam',
    ];
    return immutableFields.some((i) => fields.includes(i));
  }
}

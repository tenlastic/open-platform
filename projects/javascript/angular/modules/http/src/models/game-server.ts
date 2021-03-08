import { Game } from './game';
import { Model } from './model';
import { Queue } from './queue';

export namespace IGameServer {
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

  export enum Status {
    Running = 'running',
    Terminated = 'terminated',
    Waiting = 'waiting',
  }

  export interface Endpoints {
    tcp?: string;
    udp?: string;
    websocket?: string;
  }
}

export class GameServer extends Model {
  public allowedUserIds: string[];
  public buildId: string;
  public cpu: number;
  public currentUserIds: string[];
  public description: string;
  public endpoints: IGameServer.Endpoints;
  public game: Game;
  public gameId: string;
  public isPersistent: boolean;
  public isPreemptible: boolean;
  public memory: number;
  public metadata: any;
  public name: string;
  public namespaceId: string;
  public port: number;
  public queue: Queue;
  public queueId: string;
  public status: IGameServer.Status;

  constructor(params: Partial<GameServer> = {}) {
    super(params);

    this.game = this.game ? new Game(this.game) : null;
  }

  public static isRestartRequired(fields: string[]) {
    const immutableFields = [
      'buildId',
      'cpu',
      'isPersistent',
      'isPreemptible',
      'memory',
      'metadata',
    ];

    return immutableFields.some(i => fields.includes(i));
  }
}

import { Model } from './model';
import { Queue } from './queue';

export namespace IGameServer {
  export const Cpu = [0.1, 0.25, 0.5];
  export const Memory = [0.1, 0.25, 0.5, 1, 2.5, 5];

  export enum Status {
    Running = 'running',
    Terminated = 'terminated',
    Waiting = 'waiting',
  }
}

export class GameServer extends Model {
  public allowedUserIds: string[];
  public buildId: string;
  public cpu: number;
  public currentUserIds: string[];
  public description: string;
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
  }
}

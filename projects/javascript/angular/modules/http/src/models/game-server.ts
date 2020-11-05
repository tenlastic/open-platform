import { Model } from './model';
import { Queue } from './queue';

export enum GameServerStatus {
  Running = 'running',
  Terminated = 'terminated',
  Waiting = 'waiting',
}

export class GameServer extends Model {
  public allowedUserIds: string[];
  public buildId: string;
  public currentUserIds: string[];
  public description: string;
  public isPersistent: boolean;
  public isPreemptible: boolean;
  public metadata: any;
  public name: string;
  public namespaceId: string;
  public port: number;
  public queue: Queue;
  public queueId: string;
  public status: GameServerStatus;

  constructor(params: Partial<GameServer> = {}) {
    super(params);
  }
}

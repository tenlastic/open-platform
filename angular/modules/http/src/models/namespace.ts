import { Model } from './model';

export namespace INamespace {
  export interface BuildLimits {
    count: number;
    size: number;
  }

  export interface GameLimits {
    count: number;
    images: number;
    public: number;
    size: number;
    videos: number;
  }

  export interface GameServerLimits {
    cpu: number;
    memory: number;
    preemptible: boolean;
  }

  export interface Limits {
    builds: BuildLimits;
    gameServers: GameServerLimits;
    games: GameLimits;
    queues: QueueLimits;
    workflows: WorkflowLimits;
  }

  export interface QueueLimits {
    cpu: number;
    memory: number;
    preemptible: boolean;
    replicas: number;
  }

  export interface WorkflowLimits {
    count: number;
    cpu: number;
    memory: number;
    parallelism: number;
    preemptible: boolean;
    storage: number;
  }
}

export class Namespace extends Model {
  public limits: INamespace.Limits;
  public name: string;

  constructor(params?: Partial<Namespace>) {
    super(params);
  }
}

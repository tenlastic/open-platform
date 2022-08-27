import { BaseModel } from './base';

export namespace INamespace {
  export interface BuildLimits {
    count: number;
    size: number;
  }

  export interface GameServerLimits {
    cpu: number;
    memory: number;
    preemptible: boolean;
  }

  export interface Limits {
    builds: BuildLimits;
    gameServers: GameServerLimits;
    queues: QueueLimits;
    storefronts: StorefrontLimits;
    workflows: WorkflowLimits;
  }

  export interface QueueLimits {
    cpu: number;
    memory: number;
    preemptible: boolean;
    replicas: number;
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
    displayName?: string;
    phase: string;
  }

  export interface StorefrontLimits {
    count: number;
    images: number;
    public: number;
    size: number;
    videos: number;
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

export class NamespaceModel extends BaseModel {
  public limits: INamespace.Limits;
  public name: string;
  public status: INamespace.Status;

  constructor(parameters?: Partial<NamespaceModel>) {
    super(parameters);
  }
}

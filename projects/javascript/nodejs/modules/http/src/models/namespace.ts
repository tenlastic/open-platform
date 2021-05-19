import { BaseModel } from './base';

export namespace INamespace {
  export enum Role {
    Articles = 'articles',
    Builds = 'builds',
    Databases = 'databases',
    GameServers = 'game-servers',
    Games = 'games',
    Namespaces = 'namespaces',
    Queues = 'queues',
    Workflows = 'workflows',
  }

  export interface BuildLimits {
    count: number;
    size: number;
  }

  export interface DatabaseLimits {
    cpu: number;
    memory: number;
    preemptible: boolean;
    replicas: number;
    storage: number;
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

  export interface Key {
    description: string;
    roles: string[];
    value: string;
  }

  export interface Limits {
    builds: BuildLimits;
    databases: DatabaseLimits;
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

  export interface User {
    _id: string;
    roles: string[];
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
  public keys: INamespace.Key[];
  public limits: INamespace.Limits;
  public name: string;
  public users: INamespace.User[];

  constructor(parameters: Partial<NamespaceModel> = {}) {
    super(parameters);
  }
}

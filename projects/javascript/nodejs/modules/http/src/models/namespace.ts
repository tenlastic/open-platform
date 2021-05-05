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
    count: number;
    cpu: number;
    memory: number;
    preemptible: boolean;
  }

  export interface GameLimits {
    count: number;
    images: number;
    size: number;
    videos: number;
  }

  export interface GameServerLimits {
    count: number;
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
    count: number;
    cpu: number;
    memory: number;
    preemptible: boolean;
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
  }
}

export interface NamespaceModel extends BaseModel {
  keys: INamespace.Key[];
  limits: INamespace.Limits;
  name: string;
  users: INamespace.User[];
}

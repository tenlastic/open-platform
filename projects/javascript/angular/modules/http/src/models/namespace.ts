import { Model } from './model';

export namespace INamespace {
  export enum Role {
    Articles = 'articles',
    Builds = 'builds',
    Databases = 'databases',
    GameServers = 'game-servers',
    GameInvitations = 'game-invitations',
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

export class Namespace extends Model {
  public keys: INamespace.Key[];
  public limits: INamespace.Limits;
  public name: string;
  public users: INamespace.User[];

  constructor(params?: Partial<Namespace>) {
    super(params);
  }
}

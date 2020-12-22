import { Model } from './model';

export namespace INamespace {
  export enum Role {
    Articles = 'articles',
    Builds = 'builds',
    Collections = 'collections',
    GameServers = 'game-servers',
    GameInvitations = 'game-invitations',
    Games = 'games',
    Namespaces = 'namespaces',
    Queues = 'queues',
    Workflows = 'workflows',
  }

  export interface CollectionLimits {
    count: number;
    size: number;
  }

  export interface GameLimits {
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
    collections: CollectionLimits;
    gameServers: GameServerLimits;
    games: GameLimits;
    builds: BuildLimits;
  }

  export interface BuildLimits {
    count: number;
    size: number;
  }

  export interface User {
    _id: string;
    roles: string[];
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

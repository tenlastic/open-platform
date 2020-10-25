import { Model } from './model';

export namespace INamespace {
  export enum Role {
    Articles = 'articles',
    Collections = 'collections',
    GameServers = 'game-servers',
    GameInvitations = 'game-invitations',
    Games = 'games',
    Namespaces = 'namespaces',
    Queues = 'queues',
    Releases = 'releases',
  }

  export interface Key {
    description: string;
    roles: string[];
    value: string;
  }

  export interface User {
    _id: string;
    roles: string[];
  }
}

export class Namespace extends Model {
  public keys: INamespace.Key[];
  public name: string;
  public users: INamespace.User[];

  constructor(params?: Partial<Namespace>) {
    super(params);
  }
}

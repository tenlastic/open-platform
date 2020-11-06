import { Model } from './model';

export namespace IUser {
  export enum Role {
    Articles = 'articles',
    Builds = 'builds',
    Collections = 'collections',
    GameServers = 'game-servers',
    GameInvitations = 'game-invitations',
    Games = 'games',
    Namespaces = 'namespaces',
    Queues = 'queues',
    Users = 'users',
  }
}

export class User extends Model {
  public email: string;
  public password: string;
  public roles: string[];
  public username: string;

  constructor(params?: Partial<User>) {
    super(params);
  }
}

import { Model } from './model';

export namespace IUser {
  export enum Role {
    Articles = 'articles',
    Builds = 'builds',
    Databases = 'databases',
    GameServers = 'game-servers',
    Games = 'games',
    Namespaces = 'namespaces',
    Queues = 'queues',
    Users = 'users',
    Workflows = 'workflows',
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

import { BaseModel } from './base';

export namespace IUser {
  export enum Role {
    Articles = 'articles',
    Builds = 'builds',
    Collections = 'collections',
    GameServers = 'game-servers',
    Games = 'games',
    Namespaces = 'namespaces',
    Queues = 'queues',
    Users = 'users',
    Workflows = 'workflows',
  }
}

export class UserModel extends BaseModel {
  public email: string;
  public password: string;
  public roles: string[];
  public username: string;

  constructor(parameters: Partial<UserModel> = {}) {
    super(parameters);
  }
}

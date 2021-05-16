import { BaseModel } from './base';

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

export interface UserModel extends BaseModel {
  email?: string;
  password?: string;
  roles?: IUser.Role[];
  username?: string;
}

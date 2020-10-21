import { Model } from './model';

export namespace INamespace {
  export interface AccessControlListItem {
    roles: string[];
    userId: string;
  }

  export enum Role {
    Articles = 'articles',
    Databases = 'databases',
    GameServers = 'game-servers',
    GameInvitations = 'game-invitations',
    Games = 'games',
    Namespaces = 'namespaces',
    Queues = 'queues',
    RefreshTokens = 'refresh-tokens',
    Releases = 'releases',
  }
}

export class Namespace extends Model {
  public accessControlList: INamespace.AccessControlListItem[];
  public name: string;

  constructor(params?: Partial<Namespace>) {
    super(params);
  }
}

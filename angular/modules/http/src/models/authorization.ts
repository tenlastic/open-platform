import { Model } from './model';
import { Namespace } from './namespace';
import { User } from './user';

export namespace IAuthorization {
  export enum AuthorizationRole {
    ArticlesRead = 'Articles:Read',
    ArticlesReadPublished = 'Articles:ReadPublished',
    ArticlesReadWrite = 'Articles:ReadWrite',
    AuthorizationsRead = 'Authorizations:Read',
    AuthorizationsReadWrite = 'Authorizations:ReadWrite',
    BuildsRead = 'Builds:Read',
    BuildsReadPublished = 'Builds:ReadPublished',
    BuildsReadWrite = 'Builds:ReadWrite',
    CollectionsRead = 'Collections:Read',
    CollectionsReadWrite = 'Collections:ReadWrite',
    GameServersRead = 'GameServers:Read',
    GameServersReadWrite = 'GameServers:ReadWrite',
    GamesRead = 'Games:Read',
    GamesReadWrite = 'Games:ReadWrite',
    LoginsRead = 'Logins:Read',
    NamespacesRead = 'Namespaces:Read',
    NamespacesReadWrite = 'Namespaces:ReadWrite',
    QueuesRead = 'Queues:Read',
    QueuesReadWrite = 'Queues:ReadWrite',
    UsersRead = 'Users:Read',
    UsersReadWrite = 'Users:ReadWrite',
    WebSocketsRead = 'WebSockets:Read',
    WebSocketsReadWrite = 'WebSockets:ReadWrite',
    WorkflowsRead = 'Workflows:Read',
    WorkflowsReadWrite = 'Workflows:ReadWrite',
  }

  export const articleRoles = [
    AuthorizationRole.ArticlesRead,
    AuthorizationRole.ArticlesReadPublished,
    AuthorizationRole.ArticlesReadWrite,
  ];
  export const authorizationRoles = [
    AuthorizationRole.AuthorizationsRead,
    AuthorizationRole.AuthorizationsReadWrite,
  ];
  export const buildRoles = [
    AuthorizationRole.BuildsRead,
    AuthorizationRole.BuildsReadPublished,
    AuthorizationRole.BuildsReadWrite,
  ];
  export const collectionRoles = [
    AuthorizationRole.CollectionsRead,
    AuthorizationRole.CollectionsReadWrite,
  ];
  export const gameRoles = [AuthorizationRole.GamesRead, AuthorizationRole.GamesReadWrite];
  export const gameServerRoles = [
    AuthorizationRole.GameServersRead,
    AuthorizationRole.GameServersReadWrite,
  ];
  export const namespaceRoles = [
    AuthorizationRole.NamespacesRead,
    AuthorizationRole.NamespacesReadWrite,
  ];
  export const queueRoles = [AuthorizationRole.QueuesRead, AuthorizationRole.QueuesReadWrite];
  export const userRoles = [AuthorizationRole.UsersRead, AuthorizationRole.UsersReadWrite];
  export const webSocketRoles = [
    AuthorizationRole.WebSocketsRead,
    AuthorizationRole.WebSocketsReadWrite,
  ];
  export const workflowRoles = [
    AuthorizationRole.WorkflowsRead,
    AuthorizationRole.WorkflowsReadWrite,
  ];
}

export class Authorization extends Model {
  public apiKey: string;
  public name: string;
  public namespace: Namespace;
  public namespaceId: string;
  public roles: IAuthorization.AuthorizationRole[];
  public user: User;
  public userId: string;

  constructor(params?: Partial<Authorization>) {
    super(params);
  }

  public hasRoles(roles: IAuthorization.AuthorizationRole[]) {
    return this.roles?.some((r) => roles.includes(r));
  }
}

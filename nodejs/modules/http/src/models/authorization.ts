import { BaseModel } from './base';

export namespace IAuthorization {
  export enum Role {
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
    LoginsRead = 'Logins:Read',
    MatchesRead = 'Matches:Read',
    MatchesReadStarted = 'Matches:ReadStarted',
    MatchesReadWrite = 'Matches:ReadWrite',
    NamespacesRead = 'Namespaces:Read',
    NamespacesReadWrite = 'Namespaces:ReadWrite',
    QueuesRead = 'Queues:Read',
    QueuesReadWrite = 'Queues:ReadWrite',
    RecordsRead = 'Records:Read',
    RecordsReadWrite = 'Records:ReadWrite',
    StorefrontsRead = 'Storefronts:Read',
    StorefrontsReadWrite = 'Storefronts:ReadWrite',
    UsersRead = 'Users:Read',
    UsersReadWrite = 'Users:ReadWrite',
    WebSocketsRead = 'WebSockets:Read',
    WebSocketsReadWrite = 'WebSockets:ReadWrite',
    WorkflowsRead = 'Workflows:Read',
    WorkflowsReadWrite = 'Workflows:ReadWrite',
  }

  export const articleRoles = [
    Role.ArticlesReadPublished,
    Role.ArticlesRead,
    Role.ArticlesReadWrite,
  ];
  export const authorizationRoles = [Role.AuthorizationsRead, Role.AuthorizationsReadWrite];
  export const buildRoles = [Role.BuildsReadPublished, Role.BuildsRead, Role.BuildsReadWrite];
  export const collectionRoles = [Role.CollectionsRead, Role.CollectionsReadWrite];
  export const gameServerRoles = [Role.GameServersRead, Role.GameServersReadWrite];
  export const matchRoles = [Role.MatchesRead, Role.MatchesReadWrite];
  export const namespaceRoles = [Role.NamespacesRead, Role.NamespacesReadWrite];
  export const queueRoles = [Role.QueuesRead, Role.QueuesReadWrite];
  export const recordRoles = [Role.RecordsRead, Role.RecordsReadWrite];
  export const storefrontRoles = [Role.StorefrontsRead, Role.StorefrontsReadWrite];
  export const userRoles = [Role.UsersRead, Role.UsersReadWrite];
  export const webSocketRoles = [Role.WebSocketsRead, Role.WebSocketsReadWrite];
  export const workflowRoles = [Role.WorkflowsRead, Role.WorkflowsReadWrite];
}

export class AuthorizationModel extends BaseModel {
  public apiKey: string;
  public bannedAt: Date;
  public name: string;
  public namespaceId: string;
  public roles: IAuthorization.Role[];
  public userId: string;

  constructor(parameters?: Partial<AuthorizationModel>) {
    super(parameters);

    this.bannedAt = parameters?.bannedAt ? new Date(parameters.bannedAt) : null;
  }

  public hasRoles(roles: IAuthorization.Role[]) {
    return this.roles?.some((r) => roles.includes(r));
  }
}

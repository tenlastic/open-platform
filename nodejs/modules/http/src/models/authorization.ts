import { BaseModel } from './base';

export namespace IAuthorization {
  export enum Role {
    ArticlesRead = 'Articles:Read',
    ArticlesReadPublished = 'Articles:ReadPublished',
    ArticlesWrite = 'Articles:Write',
    AuthorizationsRead = 'Authorizations:Read',
    AuthorizationsWrite = 'Authorizations:Write',
    BuildsRead = 'Builds:Read',
    BuildsReadPublished = 'Builds:ReadPublished',
    BuildsWrite = 'Builds:Write',
    CollectionsRead = 'Collections:Read',
    CollectionsWrite = 'Collections:Write',
    GameServersRead = 'GameServers:Read',
    GameServersReadAuthorized = 'GameServers:ReadAuthorized',
    GameServersWrite = 'GameServers:Write',
    LoginsRead = 'Logins:Read',
    MatchesRead = 'Matches:Read',
    MatchesWrite = 'Matches:Write',
    NamespacesRead = 'Namespaces:Read',
    NamespacesWrite = 'Namespaces:Write',
    QueuesRead = 'Queues:Read',
    QueuesWrite = 'Queues:Write',
    RecordsRead = 'Records:Read',
    RecordsWrite = 'Records:Write',
    StorefrontsRead = 'Storefronts:Read',
    StorefrontsWrite = 'Storefronts:Write',
    UsersRead = 'Users:Read',
    UsersWrite = 'Users:Write',
    WebSocketsRead = 'WebSockets:Read',
    WebSocketsWrite = 'WebSockets:Write',
    WorkflowsRead = 'Workflows:Read',
    WorkflowsWrite = 'Workflows:Write',
  }

  export const articleRoles = [Role.ArticlesRead, Role.ArticlesReadPublished, Role.ArticlesWrite];
  export const authorizationRoles = [Role.AuthorizationsRead, Role.AuthorizationsWrite];
  export const buildRoles = [Role.BuildsReadPublished, Role.BuildsRead, Role.BuildsWrite];
  export const collectionRoles = [Role.CollectionsRead, Role.CollectionsWrite];
  export const gameServerRoles = [
    Role.GameServersRead,
    Role.GameServersReadAuthorized,
    Role.GameServersWrite,
  ];
  export const matchRoles = [Role.MatchesRead, Role.MatchesWrite];
  export const namespaceRoles = [Role.NamespacesRead, Role.NamespacesWrite];
  export const queueRoles = [Role.QueuesRead, Role.QueuesWrite];
  export const recordRoles = [Role.RecordsRead, Role.RecordsWrite];
  export const storefrontRoles = [Role.StorefrontsRead, Role.StorefrontsWrite];
  export const userRoles = [Role.UsersRead, Role.UsersWrite];
  export const webSocketRoles = [Role.WebSocketsRead, Role.WebSocketsWrite];
  export const workflowRoles = [Role.WorkflowsRead, Role.WorkflowsWrite];
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

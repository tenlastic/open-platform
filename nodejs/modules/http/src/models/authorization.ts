import { BaseModel } from './base';

export namespace IAuthorization {
  export enum Role {
    ArticlesPlay = 'Articles:Play',
    ArticlesRead = 'Articles:Read',
    ArticlesWrite = 'Articles:Write',
    AuthorizationsRead = 'Authorizations:Read',
    AuthorizationsWrite = 'Authorizations:Write',
    BuildLogsRead = 'BuildLogs:Read',
    BuildsPlay = 'Builds:Play',
    BuildsRead = 'Builds:Read',
    BuildsWrite = 'Builds:Write',
    CollectionsRead = 'Collections:Read',
    CollectionsWrite = 'Collections:Write',
    GameServerLogsRead = 'GameServerLogs:Read',
    GameServersPlay = 'GameServers:Play',
    GameServersRead = 'GameServers:Read',
    GameServersWrite = 'GameServers:Write',
    GroupsPlay = 'Groups:Play',
    GroupsRead = 'Groups:Read',
    GroupsWrite = 'Groups:Write',
    LoginsRead = 'Logins:Read',
    MatchesRead = 'Matches:Read',
    MatchesWrite = 'Matches:Write',
    MessagesPlay = 'Messages:Play',
    MessagesRead = 'Messages:Read',
    MessagesWrite = 'Messages:Write',
    NamespaceLogsRead = 'NamespaceLogs:Read',
    NamespacesRead = 'Namespaces:Read',
    NamespacesWrite = 'Namespaces:Write',
    QueueLogsRead = 'QueueLogs:Read',
    QueuesPlay = 'Queues:Play',
    QueuesRead = 'Queues:Read',
    QueuesWrite = 'Queues:Write',
    RecordsRead = 'Records:Read',
    RecordsWrite = 'Records:Write',
    SteamIntegrationsRead = 'SteamIntegrations:Read',
    SteamIntegrationsWrite = 'SteamIntegrations:Write',
    StorefrontsRead = 'Storefronts:Read',
    StorefrontsWrite = 'Storefronts:Write',
    TeamsPlay = 'Teams:Play',
    TeamsRead = 'Teams:Read',
    TeamsWrite = 'Teams:Write',
    UsersRead = 'Users:Read',
    UsersWrite = 'Users:Write',
    WebSocketsRead = 'WebSockets:Read',
    WebSocketsWrite = 'WebSockets:Write',
    WorkflowLogsRead = 'WorkflowLogs:Read',
    WorkflowsRead = 'Workflows:Read',
    WorkflowsWrite = 'Workflows:Write',
  }

  export const articleRoles = [Role.ArticlesPlay, Role.ArticlesRead, Role.ArticlesWrite];
  export const authorizationRoles = [Role.AuthorizationsRead, Role.AuthorizationsWrite];
  export const buildRoles = [Role.BuildsPlay, Role.BuildsRead, Role.BuildsWrite];
  export const collectionRoles = [Role.CollectionsRead, Role.CollectionsWrite];
  export const gameServerRoles = [
    Role.GameServersPlay,
    Role.GameServersRead,
    Role.GameServersWrite,
  ];
  export const groupRoles = [Role.GroupsPlay, Role.GroupsRead, Role.GroupsWrite];
  export const matchRoles = [Role.MatchesRead, Role.MatchesWrite];
  export const messageRoles = [Role.MessagesPlay, Role.MessagesRead, Role.MatchesWrite];
  export const namespaceRoles = [Role.NamespacesRead, Role.NamespacesWrite];
  export const queueRoles = [Role.QueuesPlay, Role.QueuesRead, Role.QueuesWrite];
  export const recordRoles = [Role.RecordsRead, Role.RecordsWrite];
  export const steamIntegrationRoles = [Role.SteamIntegrationsRead, Role.SteamIntegrationsWrite];
  export const storefrontRoles = [Role.StorefrontsRead, Role.StorefrontsWrite];
  export const teamRoles = [Role.TeamsPlay, Role.TeamsRead, Role.TeamsWrite];
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

    if (parameters?.bannedAt) {
      this.bannedAt = new Date(parameters.bannedAt);
    }
  }

  public hasRoles(roles: IAuthorization.Role[]) {
    return this.roles?.some((r) => roles.includes(r));
  }
}

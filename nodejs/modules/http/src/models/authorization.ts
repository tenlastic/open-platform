import { namespaceQuery } from '../stores/namespace';
import { userQuery } from '../stores/user';
import { BaseModel } from './base';

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
  WorkflowsRead = 'Workflows:Read',
  WorkflowsReadWrite = 'Workflows:ReadWrite',
}

export class AuthorizationModel extends BaseModel {
  public key: string;
  public get namespace() {
    return namespaceQuery.getEntity(this.namespaceId);
  }
  public namespaceId: string;
  public roles: AuthorizationRole[];
  public system: boolean;
  public get user() {
    return userQuery.getEntity(this.userId);
  }
  public userId: string;

  constructor(parameters: Partial<AuthorizationModel> = {}) {
    super(parameters);
  }
}

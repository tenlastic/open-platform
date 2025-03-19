import {
  DocumentType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  pre,
  prop,
  PropType,
} from '@typegoose/typegoose';
import * as jsonwebtoken from 'jsonwebtoken';
import * as mongoose from 'mongoose';

import { duplicateKeyErrorPlugin, unsetPlugin } from '../../plugins';

export enum AuthorizationRole {
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
  QueuesRead = 'Queues:Read',
  QueuesWrite = 'Queues:Write',
  RecordsRead = 'Records:Read',
  RecordsWrite = 'Records:Write',
  SteamIntegrationsRead = 'SteamIntegrations:Read',
  SteamIntegrationsWrite = 'SteamIntegrations:Write',
  StorefrontsRead = 'Storefronts:Read',
  StorefrontsWrite = 'Storefronts:Write',
  UsersRead = 'Users:Read',
  UsersWrite = 'Users:Write',
  WebSocketsRead = 'WebSockets:Read',
  WebSocketsWrite = 'WebSockets:Write',
  WorkflowLogsRead = 'WorkflowLogs:Read',
  WorkflowsRead = 'Workflows:Read',
  WorkflowsWrite = 'Workflows:Write',
}

@index({ apiKey: 1 }, { partialFilterExpression: { apiKey: { $exists: true } }, unique: true })
@index({ bannedAt: 1 })
@index(
  { name: 1, namespaceId: 1 },
  { partialFilterExpression: { name: { $exists: true } }, unique: true },
)
@index({ namespaceId: 1, userId: 1 }, { partialFilterExpression: { apiKey: null }, unique: true })
@index({ roles: 1 })
@modelOptions({ schemaOptions: { collection: 'authorizations', timestamps: true } })
@plugin(duplicateKeyErrorPlugin)
@plugin(unsetPlugin)
@pre('validate', function (this: AuthorizationDocument) {
  if (!this.apiKey && !this.namespaceId && !this.userId) {
    const message = 'API Key, Namespace, and/or User must be specified.';
    this.invalidate('apiKey', message, this.apiKey);
    this.invalidate('namespaceId', message, this.namespaceId);
    this.invalidate('userId', message, this.userId);
  } else if (this.apiKey && this.bannedAt) {
    const message = 'API Keys cannot be banned.';
    this.invalidate('apiKey', message, this.apiKey);
    this.invalidate('bannedAt', message, this.bannedAt);
  } else if (this.apiKey && !this.name) {
    const message = 'API Keys must have a name.';
    this.invalidate('apiKey', message, this.apiKey);
    this.invalidate('name', message, this.name);
  } else if (this.apiKey && !this.namespaceId) {
    const message = 'API Keys must specify a Namespace.';
    this.invalidate('apiKey', message, this.apiKey);
    this.invalidate('namespaceId', message, this.namespaceId);
  } else if (this.apiKey && this.userId) {
    const message = 'API Key and User cannot be specified together.';
    this.invalidate('apiKey', message, this.apiKey);
    this.invalidate('userId', message, this.userId);
  } else if (!this.apiKey && this.name) {
    const message = 'Name can only be specified with an API Key.';
    this.invalidate('apiKey', message, this.apiKey);
    this.invalidate('name', message, this.name);
  } else if (!this.apiKey && this.bannedAt && !this.userId) {
    const message = 'Default Authorizations cannot be banned.';
    this.invalidate('apiKey', message, this.apiKey);
    this.invalidate('bannedAt', message, this.bannedAt);
    this.invalidate('userId', message, this.userId);
  }
})
export class AuthorizationSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ maxlength: 256, trim: true, type: String })
  public apiKey: string;

  @prop({ filter: { create: true, update: true }, type: Date })
  public bannedAt: Date;

  public createdAt: Date;

  @prop({ maxlength: 64, trim: true, type: String })
  public name: string;

  @prop({ ref: 'NamespaceSchema', type: mongoose.Schema.Types.ObjectId })
  public namespaceId: mongoose.Types.ObjectId;

  @prop({ enum: AuthorizationRole, type: String }, PropType.ARRAY)
  public roles: AuthorizationRole[];

  @prop({ type: Boolean })
  public system: boolean;

  public updatedAt: Date;

  @prop({ ref: 'UserSchema', type: mongoose.Schema.Types.ObjectId })
  public userId: mongoose.Types.ObjectId;

  @prop({ foreignField: 'namespaceId', localField: 'namespaceId', ref: 'AuthorizationSchema' })
  public authorizationDocuments: AuthorizationDocument[];

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(this: typeof AuthorizationModel, values: Partial<AuthorizationSchema> = {}) {
    const defaults = {};

    return new this({ ...defaults, ...values });
  }

  /**
   * Create an access token from the Authorization.
   */
  public getSystemAccessToken(this: AuthorizationDocument) {
    const authorization = { namespaceId: this.namespaceId, roles: this.roles };
    const options = { algorithm: 'RS256' };
    const privateKey = process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n');

    return jsonwebtoken.sign({ authorization, system: true, type: 'access' }, privateKey, options);
  }
}

export type AuthorizationDocument = DocumentType<AuthorizationSchema>;
export const AuthorizationModel = getModelForClass(AuthorizationSchema);

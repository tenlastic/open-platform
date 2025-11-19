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

export interface Authorization {
  _id: mongoose.Types.ObjectId;
  apiKey?: string;
  authorizationDocuments?: AuthorizationDocument[];
  bannedAt?: Date;
  createdAt?: Date;
  name?: string;
  namespaceId?: mongoose.Types.ObjectId;
  roles?: AuthorizationRole[];
  system?: boolean;
  updatedAt?: Date;
  userId?: mongoose.Types.ObjectId;
}

export interface AuthorizationDocument
  extends mongoose.Document<mongoose.Types.ObjectId>,
    Authorization {
  /**
   * Create an access token from the Authorization.
   */
  getSystemAccessToken(this: AuthorizationDocument): string;
}

export interface AuthorizationModelType extends mongoose.Model<AuthorizationDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(this: AuthorizationModelType, values?: Partial<Authorization>): AuthorizationDocument;
}

const AuthorizationSchema = new mongoose.Schema<AuthorizationDocument, AuthorizationModelType>(
  {
    apiKey: { maxlength: 256, trim: true, type: String },
    bannedAt: { type: Date },
    name: { maxlength: 64, trim: true, type: String },
    namespaceId: { ref: 'NamespaceSchema', type: mongoose.Schema.Types.ObjectId },
    roles: { enum: Object.values(AuthorizationRole), type: [String] },
    system: { type: Boolean },
    userId: { ref: 'UserSchema', type: mongoose.Schema.Types.ObjectId },
  },
  {
    collection: 'authorizations',
    timestamps: true,
  },
);

AuthorizationSchema.index(
  { apiKey: 1 },
  { partialFilterExpression: { apiKey: { $exists: true } }, unique: true },
);

AuthorizationSchema.index({ bannedAt: 1 });

AuthorizationSchema.index(
  { name: 1, namespaceId: 1 },
  { partialFilterExpression: { name: { $exists: true } }, unique: true },
);

AuthorizationSchema.index(
  { namespaceId: 1, userId: 1 },
  { partialFilterExpression: { apiKey: null }, unique: true },
);

AuthorizationSchema.index({ roles: 1 });

AuthorizationSchema.plugin(duplicateKeyErrorPlugin);
AuthorizationSchema.plugin(unsetPlugin);

AuthorizationSchema.virtual('authorizationDocuments', {
  foreignField: 'namespaceId',
  justOne: false,
  localField: 'namespaceId',
  ref: 'AuthorizationSchema',
});

AuthorizationSchema.pre('validate', function (this: AuthorizationDocument) {
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
});

AuthorizationSchema.statics.mock = function (values: Partial<Authorization> = {}) {
  const defaults: Partial<Authorization> = {};

  return new this({ ...defaults, ...values });
};

AuthorizationSchema.methods.getSystemAccessToken = function (this: AuthorizationDocument) {
  const authorization = { namespaceId: this.namespaceId, roles: this.roles };
  const options = { algorithm: 'RS256' } as jsonwebtoken.SignOptions;
  const privateKey = process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n');

  return jsonwebtoken.sign({ authorization, system: true, type: 'access' }, privateKey, options);
};

export const AuthorizationModel = mongoose.model<AuthorizationDocument, AuthorizationModelType>(
  'AuthorizationSchema',
  AuthorizationSchema,
  'authorizations',
);

export default AuthorizationModel;

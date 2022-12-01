import {
  DocumentType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  pre,
  prop,
  PropType,
  ReturnModelType,
} from '@typegoose/typegoose';
import * as jsonwebtoken from 'jsonwebtoken';
import * as mongoose from 'mongoose';

import { duplicateKeyErrorPlugin, unsetPlugin } from '../../plugins';

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
  LoginsRead = 'Logins:Read',
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

  this.validateRoles();
})
export class AuthorizationSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ type: String })
  public apiKey: string;

  @prop({ type: Date })
  public bannedAt: Date;

  public createdAt: Date;

  @prop({ type: String })
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
  public static mock(this: AuthorizationModel, values: Partial<AuthorizationSchema> = {}) {
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

  /**
   * Allows only one role per entity.
   */
  private validateRoles(this: AuthorizationDocument) {
    const set = new Set<string>();

    for (const role of this.roles) {
      const [entity] = role.split(':');

      if (set.has(entity)) {
        this.invalidate('roles', 'Only one role can be set per entity.', role, 'DuplicateRole');
      } else {
        set.add(entity);
      }
    }
  }
}

export type AuthorizationDocument = DocumentType<AuthorizationSchema>;
export type AuthorizationModel = ReturnModelType<typeof AuthorizationSchema>;
export const Authorization = getModelForClass(AuthorizationSchema);

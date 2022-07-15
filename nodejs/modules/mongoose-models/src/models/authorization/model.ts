import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  prop,
  pre,
} from '@typegoose/typegoose';
import * as jwt from 'jsonwebtoken';
import * as mongoose from 'mongoose';

import { EventEmitter, IDatabasePayload, changeStreamPlugin } from '../../change-stream';
import * as errors from '../../errors';
import { NamespaceDocument, NamespaceEvent } from '../namespace/model';
import { UserDocument, UserEvent } from '../user/model';
import { AuthorizationPermissions } from './permissions';

export const AuthorizationEvent = new EventEmitter<IDatabasePayload<AuthorizationDocument>>();

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

// Delete Authorizations if associated Namespace is deleted.
NamespaceEvent.sync(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      const records = await Authorization.find({ namespaceId: payload.fullDocument._id });
      const promises = records.map((r) => r.remove());
      return Promise.all(promises);
  }
});

// Delete Authorizations if associated User is deleted.
UserEvent.sync(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      const records = await Authorization.find({ userId: payload.fullDocument._id });
      const promises = records.map((r) => r.remove());
      return Promise.all(promises);
  }
});

@index({ apiKey: 1 }, { partialFilterExpression: { apiKey: { $exists: true } }, unique: true })
@index(
  { name: 1, namespaceId: 1 },
  { partialFilterExpression: { name: { $exists: true } }, unique: true },
)
@index({ namespaceId: 1, userId: 1 }, { unique: true })
@index({ roles: 1 })
@modelOptions({
  schemaOptions: { collection: 'authorizations', minimize: false, timestamps: true },
})
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: AuthorizationEvent })
@plugin(errors.unique.plugin)
@pre('validate', function (this: AuthorizationDocument) {
  if (!this.apiKey && !this.namespaceId && !this.userId) {
    const message = 'API Key, Namespace, and/or User must be specified.';
    this.invalidate('apiKey', message, this.apiKey);
    this.invalidate('namespaceId', message, this.namespaceId);
    this.invalidate('userId', message, this.userId);
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
  }

  this.validateRoles();
})
export class AuthorizationSchema {
  public _id: mongoose.Types.ObjectId;

  @prop()
  public apiKey: string;

  public createdAt: Date;

  @prop()
  public name: string;

  @prop({ ref: 'NamespaceSchema' })
  public namespaceId: mongoose.Types.ObjectId;

  @prop({ enum: AuthorizationRole, type: String })
  public roles: AuthorizationRole[];

  @prop()
  public system: boolean;

  public updatedAt: Date;

  @prop({ ref: 'UserSchema' })
  public userId: mongoose.Types.ObjectId;

  @prop({ foreignField: '_id', justOne: true, localField: 'namespaceId', ref: 'NamespaceSchema' })
  public namespaceDocument: NamespaceDocument;

  @prop({ foreignField: '_id', justOne: true, localField: 'userId', ref: 'UserSchema' })
  public userDocument: UserDocument;

  /**
   * Create an access token from the Authorization.
   */
  public getSystemAccessToken(this: AuthorizationDocument) {
    const authorization = { namespaceId: this.namespaceId, roles: this.roles };
    const options = { algorithm: 'RS256' };
    const privateKey = process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n');

    return jwt.sign({ authorization, system: true, type: 'access' }, privateKey, options);
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

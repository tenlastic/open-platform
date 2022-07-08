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
import * as mongoose from 'mongoose';
import { v4 as uuid } from 'uuid';

import { EventEmitter, IDatabasePayload, changeStreamPlugin } from '../../change-stream';
import * as errors from '../../errors';
import { NamespaceDocument, NamespaceEvent } from '../namespace/model';
import { UserDocument, UserEvent } from '../user/model';

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

@index({ key: 1 }, { unique: true })
@index({ namespaceId: 1, userId: 1 }, { unique: true })
@index({ roles: 1 })
@modelOptions({
  schemaOptions: { collection: 'authorizations', minimize: false, timestamps: true },
})
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: AuthorizationEvent })
@plugin(errors.unique.plugin)
@pre('validate', function (this: AuthorizationDocument) {
  if (!this.namespaceId && !this.userId) {
    const message = 'Namespace and/or User must be defined.';
    this.invalidate('namespaceId', message, this.namespaceId);
    this.invalidate('userId', message, this.userId);
  }

  this.validateRoles();
})
export class AuthorizationSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ default: () => uuid() })
  public key: string;

  @prop({ ref: 'NamespaceSchema' })
  public namespaceId: mongoose.Types.ObjectId;

  @prop({ enum: AuthorizationRole, type: String })
  public roles: AuthorizationRole[];

  @prop({ default: false })
  public system: boolean;

  @prop({ ref: 'UserSchema' })
  public userId: mongoose.Types.ObjectId;

  @prop({ foreignField: '_id', justOne: true, localField: 'namespaceId', ref: 'NamespaceSchema' })
  public namespaceDocument: NamespaceDocument;

  @prop({ foreignField: '_id', justOne: true, localField: 'userId', ref: 'UserSchema' })
  public userDocument: UserDocument;

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

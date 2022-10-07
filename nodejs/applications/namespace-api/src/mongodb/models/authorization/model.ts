import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  index,
  modelOptions,
  prop,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

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
@index({ name: 1, namespaceId: 1 })
@index({ namespaceId: 1, userId: 1 })
@index({ roles: 1 })
@modelOptions({
  schemaOptions: { collection: 'authorizations', minimize: false, timestamps: true },
})
export class AuthorizationSchema {
  public _id: mongoose.Types.ObjectId;

  @prop()
  public apiKey: string;

  public createdAt: Date;

  @prop({ ref: 'NamespaceSchema' })
  public namespaceId: mongoose.Types.ObjectId;

  @prop({ enum: AuthorizationRole, type: String })
  public roles: AuthorizationRole[];

  @prop()
  public system: boolean;

  public updatedAt: Date;

  @prop({ ref: 'UserSchema' })
  public userId: mongoose.Types.ObjectId;

  @prop({ foreignField: 'namespaceId', localField: 'namespaceId', ref: 'AuthorizationSchema' })
  public authorizationDocuments: AuthorizationDocument[];
}

export type AuthorizationDocument = DocumentType<AuthorizationSchema>;
export type AuthorizationModel = ReturnModelType<typeof AuthorizationSchema>;
export const Authorization = getModelForClass(AuthorizationSchema);

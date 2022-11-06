import {
  DocumentType,
  getModelForClass,
  index,
  modelOptions,
  prop,
  PropType,
  ReturnModelType,
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

@index({ apiKey: 1 })
@index({ bannedAt: 1 })
@index({ name: 1, namespaceId: 1 })
@index({ namespaceId: 1, userId: 1 })
@index({ roles: 1 })
@modelOptions({
  schemaOptions: { collection: 'authorizations', minimize: false, timestamps: true },
})
export class AuthorizationSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ type: String })
  public apiKey: string;

  @prop({ type: Date })
  public bannedAt: Date;

  public createdAt: Date;

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
}

export type AuthorizationDocument = DocumentType<AuthorizationSchema>;
export type AuthorizationModel = ReturnModelType<typeof AuthorizationSchema>;
export const Authorization = getModelForClass(AuthorizationSchema);

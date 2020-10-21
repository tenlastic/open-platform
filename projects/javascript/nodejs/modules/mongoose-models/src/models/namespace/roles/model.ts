import {
  DocumentType,
  ReturnModelType,
  arrayProp,
  getModelForClass,
  modelOptions,
  prop,
} from '@hasezoey/typegoose';
import * as mongoose from 'mongoose';

export enum NamespaceRole {
  Articles = 'articles',
  Databases = 'databases',
  GameServers = 'game-servers',
  GameInvitations = 'game-invitations',
  Games = 'games',
  Namespaces = 'namespaces',
  Queues = 'queues',
  RefreshTokens = 'refresh-tokens',
  Releases = 'releases',
}

@modelOptions({ schemaOptions: { _id: false } })
export class NamespaceRolesSchema {
  @arrayProp({ default: [], enum: NamespaceRole, items: String })
  public roles: string[];

  @prop({ required: true })
  public userId: mongoose.Types.ObjectId;
}

export type NamespaceRolesDocument = DocumentType<NamespaceRolesSchema>;
export type NamespaceRolesModel = ReturnModelType<typeof NamespaceRolesSchema>;
export const NamespaceRoles = getModelForClass(NamespaceRolesSchema);

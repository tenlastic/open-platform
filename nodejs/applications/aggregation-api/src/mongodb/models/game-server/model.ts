import {
  DocumentType,
  getModelForClass,
  index,
  modelOptions,
  prop,
  PropType,
  ReturnModelType,
  Severity,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

import { AuthorizationDocument } from '../authorization';
import { GameServerStatusSchema } from './status';

@index({ authorizedUserIds: 1 })
@index({ buildId: 1 })
@index({ currentUserIds: 1 })
@index({ namespaceId: 1 })
@index({ queueId: 1 })
@modelOptions({
  options: { allowMixed: Severity.ALLOW },
  schemaOptions: { collection: 'game-servers', minimize: false, timestamps: true },
})
export class GameServerSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ ref: 'UserSchema', type: mongoose.Schema.Types.ObjectId }, PropType.ARRAY)
  public authorizedUserIds: mongoose.Types.ObjectId[];

  @prop({ ref: 'BuildSchema', type: mongoose.Schema.Types.ObjectId })
  public buildId: mongoose.Types.ObjectId;

  @prop({ type: Number })
  public cpu: number;

  public createdAt: Date;

  @prop({ ref: 'UserSchema', type: mongoose.Schema.Types.ObjectId }, PropType.ARRAY)
  public currentUserIds: mongoose.Types.ObjectId[];

  @prop({ type: String })
  public description: string;

  @prop({ type: Number })
  public memory: number;

  @prop({ type: mongoose.Schema.Types.Mixed })
  public metadata: any;

  @prop({ type: String })
  public name: string;

  @prop({ ref: 'NamespaceSchema', type: mongoose.Schema.Types.ObjectId })
  public namespaceId: mongoose.Types.ObjectId;

  @prop({ type: Boolean })
  public persistent: boolean;

  @prop({ type: Boolean })
  public preemptible: boolean;

  @prop({ ref: 'QueueSchema', type: mongoose.Schema.Types.ObjectId })
  public queueId: mongoose.Types.ObjectId;

  @prop({ type: Date })
  public restartedAt: Date;

  @prop({ type: GameServerStatusSchema })
  public status: GameServerStatusSchema;

  public updatedAt: Date;

  @prop({ foreignField: 'namespaceId', localField: 'namespaceId', ref: 'AuthorizationSchema' })
  public authorizationDocuments: AuthorizationDocument[];
}

export type GameServerDocument = DocumentType<GameServerSchema>;
export type GameServerModel = ReturnModelType<typeof GameServerSchema>;
export const GameServer = getModelForClass(GameServerSchema);

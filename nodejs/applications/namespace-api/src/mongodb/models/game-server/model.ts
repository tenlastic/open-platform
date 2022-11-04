import { namespaceValidator } from '@tenlastic/mongoose-models';
import {
  DocumentType,
  getModelForClass,
  index,
  modelOptions,
  pre,
  prop,
  PropType,
  ReturnModelType,
  Severity,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

import { AuthorizationDocument } from '../authorization';
import { BuildDocument } from '../build';
import { QueueDocument } from '../queue';
import { UserDocument } from '../user';
import {
  GameServerStatusComponent,
  GameServerStatusComponentName,
  GameServerStatusPhase,
  GameServerStatusSchema,
} from './status';

@index({ authorizedUserIds: 1 })
@index({ buildId: 1 })
@index({ currentUserIds: 1 })
@index({ namespaceId: 1 })
@index({ queueId: 1 })
@modelOptions({
  options: { allowMixed: Severity.ALLOW },
  schemaOptions: { collection: 'game-servers', minimize: false, timestamps: true },
})
@pre('save', async function (this: GameServerDocument) {
  if (!this.isNew) {
    return;
  }

  this.status.components = [
    new GameServerStatusComponent({
      current: 0,
      name: GameServerStatusComponentName.Application,
      phase: GameServerStatusPhase.Pending,
      total: 1,
    }),
    new GameServerStatusComponent({
      current: 0,
      name: GameServerStatusComponentName.Sidecar,
      phase: GameServerStatusPhase.Pending,
      total: 1,
    }),
  ];
})
export class GameServerSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ ref: 'UserSchema', type: mongoose.Schema.Types.ObjectId }, PropType.ARRAY)
  public authorizedUserIds: mongoose.Types.ObjectId[];

  @prop({
    ref: 'BuildSchema',
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    validate: namespaceValidator('buildDocument', 'buildId'),
  })
  public buildId: mongoose.Types.ObjectId;

  @prop({ min: 0.1, required: true, type: Number })
  public cpu: number;

  public createdAt: Date;

  @prop({ ref: 'UserSchema', type: mongoose.Schema.Types.ObjectId }, PropType.ARRAY)
  public currentUserIds: mongoose.Types.ObjectId[];

  @prop({ type: String })
  public description: string;

  @prop({ min: 100 * 1000 * 1000, required: true, type: Number })
  public memory: number;

  @prop({ type: mongoose.Schema.Types.Mixed })
  public metadata: any;

  @prop({ required: true, type: String })
  public name: string;

  @prop({ ref: 'NamespaceSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public namespaceId: mongoose.Types.ObjectId;

  @prop({ type: Boolean })
  public persistent: boolean;

  @prop({ type: Boolean })
  public preemptible: boolean;

  @prop({
    ref: 'QueueSchema',
    type: mongoose.Schema.Types.ObjectId,
    validate: namespaceValidator('queueDocument', 'queueId'),
  })
  public queueId: mongoose.Types.ObjectId;

  @prop({ type: Date })
  public restartedAt: Date;

  @prop({ default: { phase: 'Pending' }, merge: true, type: GameServerStatusSchema })
  public status: GameServerStatusSchema;

  public updatedAt: Date;

  @prop({ foreignField: 'namespaceId', localField: 'namespaceId', ref: 'AuthorizationSchema' })
  public authorizationDocuments: AuthorizationDocument[];

  @prop({ foreignField: '_id', localField: 'authorizedUserIds', ref: 'UserSchema' })
  public authorizedUserDocuments: UserDocument[];

  @prop({ foreignField: '_id', justOne: true, localField: 'buildId', ref: 'BuildSchema' })
  public buildDocument: BuildDocument;

  @prop({ foreignField: '_id', localField: 'currentUserIds', ref: 'UserSchema' })
  public currentUserDocuments: UserDocument[];

  @prop({ foreignField: '_id', justOne: true, localField: 'queueId', ref: 'QueueSchema' })
  public queueDocument: QueueDocument;

  /**
   * Returns true if a restart is required on an update.
   */
  public static isRestartRequired(fields: string[]) {
    const immutableFields = ['buildId', 'cpu', 'memory', 'preemptible', 'restartedAt'];
    return immutableFields.some((i) => fields.includes(i));
  }
}

export type GameServerDocument = DocumentType<GameServerSchema>;
export type GameServerModel = ReturnModelType<typeof GameServerSchema>;
export const GameServer = getModelForClass(GameServerSchema);

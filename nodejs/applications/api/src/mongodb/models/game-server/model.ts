import {
  changeStreamPlugin,
  EventEmitter,
  IDatabasePayload,
  IOriginalDocument,
  namespaceValidator,
} from '@tenlastic/mongoose-models';
import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  prop,
  Severity,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

import { AuthorizationDocument } from '../authorization';
import { BuildDocument } from '../build';
import { NamespaceDocument } from '../namespace';
import { QueueDocument } from '../queue';
import { UserDocument } from '../user';
import { GameServerStatusSchema } from './status';

export const OnGameServerProduced = new EventEmitter<IDatabasePayload<GameServerDocument>>();

@index({ authorizedUserIds: 1 })
@index({ buildId: 1 })
@index({ currentUserIds: 1 })
@index({ namespaceId: 1 })
@index({ queueId: 1 })
@modelOptions({
  options: { allowMixed: Severity.ALLOW },
  schemaOptions: { collection: 'gameservers', minimize: false, timestamps: true },
})
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: OnGameServerProduced })
export class GameServerSchema implements IOriginalDocument {
  public _id: mongoose.Types.ObjectId;

  @prop({ ref: 'UserSchema' })
  public authorizedUserIds: mongoose.Types.ObjectId[];

  @prop({
    ref: 'BuildSchema',
    required: true,
    validate: namespaceValidator('buildDocument', 'buildId'),
  })
  public buildId: mongoose.Types.ObjectId;

  @prop({ min: 0.1, required: true })
  public cpu: number;

  public createdAt: Date;

  @prop({ ref: 'UserSchema', type: new mongoose.Types.ObjectId() })
  public currentUserIds: mongoose.Types.ObjectId[];

  @prop()
  public description: string;

  @prop({ min: 100 * 1000 * 1000, required: true })
  public memory: number;

  @prop()
  public metadata: any;

  @prop({ required: true })
  public name: string;

  @prop({ immutable: true, ref: 'NamespaceSchema', required: true })
  public namespaceId: mongoose.Types.ObjectId;

  @prop()
  public persistent: boolean;

  @prop()
  public preemptible: boolean;

  @prop({ ref: 'QueueSchema', validate: namespaceValidator('queueDocument', 'queueId') })
  public queueId: mongoose.Types.ObjectId;

  @prop()
  public restartedAt: Date;

  @prop({ default: { phase: 'Pending' } })
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

  @prop({ foreignField: '_id', justOne: true, localField: 'namespaceId', ref: 'NamespaceSchema' })
  public namespaceDocument: NamespaceDocument;

  @prop({ foreignField: '_id', justOne: true, localField: 'queueId', ref: 'QueueSchema' })
  public queueDocument: QueueDocument;

  public _original: any;
  public wasModified: string[];
  public wasNew: boolean;

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

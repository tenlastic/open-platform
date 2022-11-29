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
import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { namespaceValidator } from '../../validators';
import { AuthorizationDocument } from '../authorization';
import { BuildDocument } from '../build';
import { QueueDocument } from '../queue';
import {
  GameServerStatus,
  GameServerStatusComponent,
  GameServerStatusComponentName,
  GameServerStatusDocument,
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

  @prop({
    default(this: GameServerDocument) {
      return new GameServerStatus({
        components: [
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
        ],
      });
    },
    merge: true,
    type: GameServerStatusSchema,
  })
  public status: GameServerStatusDocument;

  public updatedAt: Date;

  @prop({ foreignField: 'namespaceId', localField: 'namespaceId', ref: 'AuthorizationSchema' })
  public authorizationDocuments: AuthorizationDocument[];

  @prop({ foreignField: '_id', justOne: true, localField: 'buildId', ref: 'BuildSchema' })
  public buildDocument: BuildDocument;

  @prop({ foreignField: '_id', justOne: true, localField: 'queueId', ref: 'QueueSchema' })
  public queueDocument: QueueDocument;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(this: GameServerModel, values: Partial<GameServerSchema> = {}) {
    const chance = new Chance();
    const defaults = {
      buildId: new mongoose.Types.ObjectId(),
      cpu: chance.floating({ max: 1, min: 0.1 }),
      memory: chance.integer({ max: 1 * 1000 * 1000 * 1000, min: 100 * 1000 * 1000 }),
      name: chance.hash(),
      namespaceId: new mongoose.Types.ObjectId(),
    };

    return new this({ ...defaults, ...values });
  }

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

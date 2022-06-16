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

import {
  EventEmitter,
  IDatabasePayload,
  IOriginalDocument,
  changeStreamPlugin,
} from '../../change-stream';
import { namespaceValidator } from '../../validators';
import { BuildDocument } from '../build';
import { GameDocument } from '../game';
import { Namespace, NamespaceDocument, NamespaceEvent, NamespaceLimitError } from '../namespace';
import { QueueDocument, QueueEvent } from '../queue';
import { UserDocument } from '../user';
import { GameServerStatusSchema } from './status';

export const GameServerEvent = new EventEmitter<IDatabasePayload<GameServerDocument>>();

// Delete Game Servers if associated Namespace is deleted.
NamespaceEvent.sync(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      const records = await GameServer.find({ namespaceId: payload.fullDocument._id });
      const promises = records.map((r) => r.remove());
      return Promise.all(promises);
  }
});

// Delete Game Servers if associated Queue is deleted.
QueueEvent.sync(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      const records = await GameServer.find({ queueId: payload.fullDocument._id });
      const promises = records.map((r) => r.remove());
      return Promise.all(promises);
  }
});

@index({ authorizedUserIds: 1 })
@index({ buildId: 1 })
@index({ currentUserIds: 1 })
@index({ gameId: 1 })
@index({ namespaceId: 1 })
@index({ queueId: 1 })
@modelOptions({
  options: { allowMixed: Severity.ALLOW },
  schemaOptions: { collection: 'gameservers', minimize: false, timestamps: true },
})
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: GameServerEvent })
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

  @prop({ ref: 'GameSchema', validate: namespaceValidator('gameDocument', 'gameId') })
  public gameId: mongoose.Types.ObjectId;

  @prop({ min: 100 * 1000 * 1000, required: true })
  public memory: number;

  @prop({ default: {} })
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

  @prop({ foreignField: '_id', justOne: false, localField: 'authorizedUserIds', ref: 'UserSchema' })
  public authorizedUserDocuments: UserDocument[];

  @prop({ foreignField: '_id', justOne: true, localField: 'buildId', ref: 'BuildSchema' })
  public buildDocument: BuildDocument;

  @prop({ foreignField: '_id', justOne: false, localField: 'currentUserIds', ref: 'UserSchema' })
  public currentUserDocuments: UserDocument[];

  @prop({ foreignField: '_id', justOne: true, localField: 'gameId', ref: 'GameSchema' })
  public gameDocument: GameDocument;

  @prop({ foreignField: '_id', justOne: true, localField: 'namespaceId', ref: 'NamespaceSchema' })
  public namespaceDocument: NamespaceDocument;

  @prop({ foreignField: '_id', justOne: true, localField: 'queueId', ref: 'QueueSchema' })
  public queueDocument: QueueDocument;

  public _original: any;
  public wasModified: string[];
  public wasNew: boolean;

  /**
   * Throws an error if a NamespaceLimit is exceeded.
   */
  public static async checkNamespaceLimits(
    _id: string | mongoose.Types.ObjectId,
    cpu: number,
    memory: number,
    namespaceId: string | mongoose.Types.ObjectId,
    preemptible: boolean,
  ) {
    const namespace = await Namespace.findOne({ _id: namespaceId });
    if (!namespace) {
      throw new Error('Record not found.');
    }

    const limits = namespace.limits.gameServers;

    // Preemptible.
    if (limits.preemptible && preemptible === false) {
      throw new NamespaceLimitError('gameServers.preemptible', limits.preemptible);
    }

    // Skip MongoDB query if no limits are set.
    if (!limits.cpu && !limits.memory) {
      return;
    }

    // Aggregate the sum of existing records.
    const results = await GameServer.aggregate([
      { $match: { _id: { $ne: _id }, namespaceId: namespace._id } },
      {
        $group: {
          _id: null,
          cpu: { $sum: '$cpu' },
          memory: { $sum: '$memory' },
        },
      },
    ]);

    // CPU.
    const cpuSum = results.length ? results[0].cpu : 0;
    if (limits.cpu && cpuSum + cpu > limits.cpu) {
      throw new NamespaceLimitError('gameServers.cpu', limits.cpu);
    }

    // Memory.
    const memorySum = results.length ? results[0].memory : 0;
    if (limits.memory && memorySum + memory > limits.memory) {
      throw new NamespaceLimitError('gameServers.memory', limits.memory);
    }
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

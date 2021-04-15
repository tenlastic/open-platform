import {
  DocumentType,
  Ref,
  ReturnModelType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  prop,
} from '@typegoose/typegoose';
import {
  EventEmitter,
  IDatabasePayload,
  changeStreamPlugin,
} from '@tenlastic/mongoose-change-stream';
import * as mongoose from 'mongoose';

import { namespaceValidator } from '../../validators';
import { BuildDocument } from '../build';
import { GameDocument } from '../game';
import { GameInvitationDocument } from '../game-invitation';
import { GameServerDocument } from '../game-server';
import { Namespace, NamespaceDocument, NamespaceEvent, NamespaceLimitError } from '../namespace';
import { QueueStatusSchema } from './status';

export const QueueEvent = new EventEmitter<IDatabasePayload<QueueDocument>>();

// Delete Queues if associated Namespace is deleted.
NamespaceEvent.sync(async payload => {
  switch (payload.operationType) {
    case 'delete':
      const records = await Queue.find({ namespaceId: payload.fullDocument._id });
      const promises = records.map(r => r.remove());
      return Promise.all(promises);
  }
});

@index({ gameId: 1 })
@index({ namespaceId: 1 })
@modelOptions({ schemaOptions: { collection: 'queues', minimize: false, timestamps: true } })
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: QueueEvent })
export class QueueSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ ref: 'BuildSchema', validate: namespaceValidator('buildDocument', 'buildId') })
  public buildId: Ref<BuildDocument>;

  @prop({ min: 0, required: true })
  public cpu: number;

  public createdAt: Date;

  @prop()
  public description: string;

  @prop({ ref: 'GameSchema', validate: namespaceValidator('gameDocument', 'gameId') })
  public gameId: Ref<GameDocument>;

  @prop({ _id: false, required: true })
  public gameServerTemplate: GameServerDocument;

  @prop()
  public isPreemptible: boolean;

  @prop({ min: 0, required: true })
  public memory: number;

  @prop({ default: {} })
  public metadata: any;

  @prop({ required: true })
  public name: string;

  @prop({ immutable: true, ref: 'NamespaceSchema', required: true })
  public namespaceId: Ref<NamespaceDocument>;

  @prop({ min: 0, required: true })
  public replicas: number;

  @prop({ default: { phase: 'Pending' } })
  public status: QueueStatusSchema;

  @prop({ required: true })
  public teams: number;

  public updatedAt: Date;

  @prop({ required: true })
  public usersPerTeam: number;

  @prop({ foreignField: '_id', justOne: true, localField: 'buildId', ref: 'BuildSchema' })
  public buildDocument: BuildDocument;

  @prop({ foreignField: '_id', justOne: true, localField: 'gameId', ref: 'GameSchema' })
  public gameDocument: GameDocument;

  @prop({
    foreignField: 'namespaceId',
    justOne: true,
    localField: 'namespaceId',
    ref: 'GameInvitationSchema',
  })
  public gameInvitationDocument: GameInvitationDocument;

  @prop({ foreignField: '_id', justOne: true, localField: 'namespaceId', ref: 'NamespaceSchema' })
  public namespaceDocument: NamespaceDocument;

  /**
   * Throws an error if a NamespaceLimit is exceeded.
   */
  public static async checkNamespaceLimits(
    _id: string | mongoose.Types.ObjectId,
    cpu: number,
    isPreemptible: boolean,
    memory: number,
    namespaceId: string | mongoose.Types.ObjectId | Ref<NamespaceDocument>,
    replicas: number,
  ) {
    const namespace = await Namespace.findOne({ _id: namespaceId });
    if (!namespace) {
      throw new Error('Record not found.');
    }

    const limits = namespace.limits.queues;

    // Preemptible.
    if (limits.preemptible && isPreemptible === false) {
      throw new NamespaceLimitError('queues.preemptible', limits.preemptible);
    }

    // Skip MongoDB query if no limits are set.
    if (!limits.cpu && !limits.memory && !limits.replicas) {
      return;
    }

    // Aggregate the sum of existing records.
    const results = await Queue.aggregate([
      { $match: { _id: { $ne: _id }, namespaceId: namespace._id } },
      {
        $group: {
          _id: null,
          cpu: { $sum: { $multiply: ['$cpu', '$replicas'] } },
          memory: { $sum: { $multiply: ['$memory', '$replicas'] } },
          replicas: { $sum: '$replicas' },
        },
      },
    ]);

    // CPU.
    const cpuSum = results.length ? results[0].cpu : 0;
    if (limits.cpu && cpuSum + cpu * replicas > limits.cpu) {
      throw new NamespaceLimitError('queues.cpu', limits.cpu);
    }

    // Memory.
    const memorySum = results.length ? results[0].memory : 0;
    if (limits.memory && memorySum + memory * replicas > limits.memory) {
      throw new NamespaceLimitError('queues.memory', limits.memory);
    }

    // Replicas.
    const replicasSum = results.length ? results[0].replicas : 0;
    if (limits.replicas && replicasSum + replicas > limits.replicas) {
      throw new NamespaceLimitError('queues.replicas', limits.replicas);
    }
  }

  /**
   * Returns true if a restart is required on an update.
   */
  public static isRestartRequired(fields: string[]) {
    const immutableFields = [
      'buildId',
      'cpu',
      'isPreemptible',
      'memory',
      'replicas',
      'teams',
      'usersPerTeam',
    ];
    return immutableFields.some(i => fields.includes(i));
  }
}

export type QueueDocument = DocumentType<QueueSchema>;
export type QueueModel = ReturnModelType<typeof QueueSchema>;
export const Queue = getModelForClass(QueueSchema);

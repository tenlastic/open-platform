import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  pre,
  prop,
  Severity,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

import { changeStreamPlugin, EventEmitter, IDatabasePayload } from '../../change-stream';
import { enumValidator } from '../../validators';
import { Namespace, NamespaceDocument, NamespaceLimitError } from '../namespace';
import { GameServerTemplateSchema } from './game-server-template';
import {
  QueueStatusComponent,
  QueueStatusComponentName,
  QueueStatusPhase,
  QueueStatusSchema,
} from './status';

export const OnQueueProduced = new EventEmitter<IDatabasePayload<QueueDocument>>();

@index({ namespaceId: 1 })
@modelOptions({
  options: { allowMixed: Severity.ALLOW },
  schemaOptions: { collection: 'queues', minimize: false, timestamps: true },
})
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: OnQueueProduced })
@pre('save', async function (this: QueueDocument) {
  if (!this.isNew) {
    return;
  }

  this.status.components = [
    new QueueStatusComponent({
      current: 0,
      name: QueueStatusComponentName.Application,
      phase: QueueStatusPhase.Pending,
      total: this.replicas,
    }),
    new QueueStatusComponent({
      current: 0,
      name: QueueStatusComponentName.Redis,
      phase: QueueStatusPhase.Pending,
      total: this.replicas,
    }),
    new QueueStatusComponent({
      current: 0,
      name: QueueStatusComponentName.Sidecar,
      phase: QueueStatusPhase.Pending,
      total: 1,
    }),
  ];
})
export class QueueSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ min: 0.1, required: true })
  public cpu: number;

  public createdAt: Date;

  @prop()
  public description: string;

  @prop({ required: true })
  public gameServerTemplate: GameServerTemplateSchema;

  @prop({ min: 100 * 1000 * 1000, required: true })
  public memory: number;

  @prop()
  public metadata: any;

  @prop({ required: true })
  public name: string;

  @prop({ immutable: true, ref: 'NamespaceSchema', required: true })
  public namespaceId: mongoose.Types.ObjectId;

  @prop()
  public preemptible: boolean;

  @prop({ min: 0, required: true, validate: enumValidator([1, 3, 5]) })
  public replicas: number;

  @prop()
  public restartedAt: Date;

  @prop({ default: { phase: 'Pending' } })
  public status: QueueStatusSchema;

  @prop({ min: 1, required: true })
  public teams: number;

  public updatedAt: Date;

  @prop({ min: 1, required: true })
  public usersPerTeam: number;

  @prop({ foreignField: '_id', justOne: true, localField: 'namespaceId', ref: 'NamespaceSchema' })
  public namespaceDocument: NamespaceDocument;

  /**
   * Throws an error if a NamespaceLimit is exceeded.
   */
  public static async checkNamespaceLimits(
    _id: string | mongoose.Types.ObjectId,
    cpu: number,
    memory: number,
    namespaceId: string | mongoose.Types.ObjectId,
    preemptible: boolean,
    replicas: number,
  ) {
    const namespace = await Namespace.findOne({ _id: namespaceId });
    if (!namespace) {
      throw new Error('Record not found.');
    }

    const limits = namespace.limits.queues;

    // Preemptible.
    if (limits.preemptible && preemptible === false) {
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
      'gameServerTemplate',
      'memory',
      'preemptible',
      'replicas',
      'restartedAt',
    ];

    return immutableFields.some((i) => fields.includes(i));
  }
}

export type QueueDocument = DocumentType<QueueSchema>;
export type QueueModel = ReturnModelType<typeof QueueSchema>;
export const Queue = getModelForClass(QueueSchema);

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

import { decrementalValidator, namespaceValidator } from '../../validators';
import { GameDocument } from '../game';
import { Namespace, NamespaceDocument, NamespaceEvent, NamespaceLimitError } from '../namespace';
import { DatabaseStatusSchema } from './status';

export const DatabaseEvent = new EventEmitter<IDatabasePayload<DatabaseDocument>>();

// Delete Databases if associated Namespace is deleted.
NamespaceEvent.sync(async payload => {
  switch (payload.operationType) {
    case 'delete':
      const records = await Database.find({ namespaceId: payload.fullDocument._id });
      const promises = records.map(r => r.remove());
      return Promise.all(promises);
  }
});

@index({ gameId: 1 })
@index({ namespaceId: 1 })
@modelOptions({ schemaOptions: { collection: 'databases', minimize: false, timestamps: true } })
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: DatabaseEvent })
export class DatabaseSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ min: 0, required: true })
  public cpu: number;

  public createdAt: Date;

  @prop()
  public description: string;

  @prop({ ref: 'GameSchema', validate: namespaceValidator('gameDocument', 'gameId') })
  public gameId: Ref<GameDocument>;

  @prop()
  public isPreemptible: boolean;

  @prop({ min: 0, required: true })
  public memory: number;

  @prop({ required: true })
  public name: string;

  @prop({ immutable: true, ref: 'NamespaceSchema', required: true })
  public namespaceId: Ref<NamespaceDocument>;

  @prop({ min: 0, required: true })
  public replicas: number;

  @prop({ default: { phase: 'Pending' } })
  public status: DatabaseStatusSchema;

  @prop({ min: 0, required: true, validate: decrementalValidator('storage') })
  public storage: number;

  public updatedAt: Date;

  @prop({ foreignField: '_id', justOne: true, localField: 'gameId', ref: 'GameSchema' })
  public gameDocument: GameDocument;

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
    storage: number,
  ) {
    const namespace = await Namespace.findOne({ _id: namespaceId });
    if (!namespace) {
      throw new Error('Record not found.');
    }

    const limits = namespace.limits.databases;

    // Preemptible.
    if (limits.preemptible && isPreemptible === false) {
      throw new NamespaceLimitError('databases.preemptible', limits.preemptible);
    }

    // Skip MongoDB query if no limits are set.
    if (!limits.cpu && !limits.memory && !limits.replicas && !limits.storage) {
      return;
    }

    // Aggregate the sum of existing records.
    const results = await Database.aggregate([
      { $match: { _id: { $ne: _id }, namespaceId: namespace._id } },
      {
        $group: {
          _id: null,
          cpu: { $sum: { $multiply: ['$cpu', '$replicas'] } },
          memory: { $sum: { $multiply: ['$memory', '$replicas'] } },
          replicas: { $sum: '$replicas' },
          storage: { $sum: { $multiply: ['$storage', '$replicas'] } },
        },
      },
    ]);

    // CPU.
    const cpuSum = results.length ? results[0].cpu : 0;
    if (limits.cpu && cpuSum + cpu * replicas > limits.cpu) {
      throw new NamespaceLimitError('databases.cpu', limits.cpu);
    }

    // Memory.
    const memorySum = results.length ? results[0].memory : 0;
    if (limits.memory && memorySum + memory * replicas > limits.memory) {
      throw new NamespaceLimitError('databases.memory', limits.memory);
    }

    // Replicas.
    const replicasSum = results.length ? results[0].replicas : 0;
    if (limits.replicas && replicasSum + replicas > limits.replicas) {
      throw new NamespaceLimitError('databases.replicas', limits.replicas);
    }

    // Storage.
    const storageSum = results.length ? results[0].storage : 0;
    if (limits.storage && storageSum + storage * replicas > limits.storage) {
      throw new NamespaceLimitError('databases.storage', limits.storage);
    }
  }

  /**
   * Returns true if a restart is required on an update.
   */
  public static isRestartRequired(fields: string[]) {
    const immutableFields = ['cpu', 'isPreemptible', 'memory', 'replicas', 'storage'];
    return immutableFields.some(i => fields.includes(i));
  }
}

export type DatabaseDocument = DocumentType<DatabaseSchema>;
export type DatabaseModel = ReturnModelType<typeof DatabaseSchema>;
export const Database = getModelForClass(DatabaseSchema);

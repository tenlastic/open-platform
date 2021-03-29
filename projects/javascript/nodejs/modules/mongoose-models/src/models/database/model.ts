import {
  DocumentType,
  Ref,
  ReturnModelType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  prop,
} from '@hasezoey/typegoose';
import {
  EventEmitter,
  IDatabasePayload,
  changeStreamPlugin,
} from '@tenlastic/mongoose-change-stream';
import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import * as mongoose from 'mongoose';

import { namespaceValidator } from '../../validators';
import { GameDocument } from '../game';
import { Namespace, NamespaceDocument, NamespaceEvent, NamespaceLimitError } from '../namespace';
import { DatabaseStatusSchema } from './status';

export const DatabaseEvent = new EventEmitter<IDatabasePayload<DatabaseDocument>>();

// Publish changes to Kafka.
DatabaseEvent.sync(kafka.publish);

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

  @prop({ default: { phase: 'Pending' } })
  public status: DatabaseStatusSchema;

  public updatedAt: Date;

  @prop({ foreignField: '_id', justOne: true, localField: 'gameId', ref: 'GameSchema' })
  public gameDocument: GameDocument;

  @prop({ foreignField: '_id', justOne: true, localField: 'namespaceId', ref: 'NamespaceSchema' })
  public namespaceDocument: NamespaceDocument;

  /**
   * Throws an error if a NamespaceLimit is exceeded.
   */
  public static async checkNamespaceLimits(
    count: number,
    cpu: number,
    isPreemptible: boolean,
    memory: number,
    namespaceId: string | mongoose.Types.ObjectId,
  ) {
    const namespace = await Namespace.findOne({ _id: namespaceId });
    if (!namespace) {
      throw new Error('Record not found.');
    }

    const limits = namespace.limits.databases;
    if (limits.preemptible && isPreemptible === false) {
      throw new NamespaceLimitError('databases.preemptible', limits.preemptible);
    }

    if (limits.count > 0 || limits.cpu > 0 || limits.memory > 0) {
      const results = await Database.aggregate([
        { $match: { namespaceId: namespace._id } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            cpu: { $sum: '$cpu' },
            memory: { $sum: '$memory' },
          },
        },
      ]);

      const countSum = results.length > 0 ? results[0].count : 0;
      if (limits.count > 0 && countSum + count > limits.count) {
        throw new NamespaceLimitError('databases.count', limits.count);
      }

      const cpuSum = results.length > 0 ? results[0].cpu : 0;
      if (limits.cpu > 0 && cpuSum + cpu > limits.cpu) {
        throw new NamespaceLimitError('databases.cpu', limits.cpu);
      }

      const memorySum = results.length > 0 ? results[0].memory : 0;
      if (limits.memory > 0 && memorySum + memory > limits.memory) {
        throw new NamespaceLimitError('databases.memory', limits.memory);
      }
    }
  }

  /**
   * Returns true if a restart is required on an update.
   */
  public static isRestartRequired(fields: string[]) {
    const immutableFields = ['buildId', 'cpu', 'isPreemptible', 'memory'];
    return immutableFields.some(i => fields.includes(i));
  }
}

export type DatabaseDocument = DocumentType<DatabaseSchema>;
export type DatabaseModel = ReturnModelType<typeof DatabaseSchema>;
export const Database = getModelForClass(DatabaseSchema);

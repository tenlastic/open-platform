import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  pre,
  prop,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

import { EventEmitter, IDatabasePayload, changeStreamPlugin } from '../../change-stream';
import { decrementalValidator, enumValidator, namespaceValidator } from '../../validators';
import { GameDocument } from '../game';
import { NamespaceDocument, NamespaceEvent } from '../namespace';
import {
  DatabaseStatusComponent,
  DatabaseStatusComponentName,
  DatabaseStatusPhase,
  DatabaseStatusSchema,
} from './status';

export const DatabaseEvent = new EventEmitter<IDatabasePayload<DatabaseDocument>>();

// Delete Databases if associated Namespace is deleted.
NamespaceEvent.sync(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      const records = await Database.find({ namespaceId: payload.fullDocument._id });
      const promises = records.map((r) => r.remove());
      return Promise.all(promises);
  }
});

@index({ gameId: 1 })
@index({ namespaceId: 1 })
@modelOptions({ schemaOptions: { collection: 'databases', minimize: false, timestamps: true } })
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: DatabaseEvent })
@pre('save', async function (this: DatabaseDocument) {
  if (!this.isNew) {
    return;
  }

  this.status.components = [
    new DatabaseStatusComponent({
      current: 0,
      name: DatabaseStatusComponentName.Application,
      phase: DatabaseStatusPhase.Pending,
      total: this.replicas,
    }),
    new DatabaseStatusComponent({
      current: 0,
      name: DatabaseStatusComponentName.MongoDB,
      phase: DatabaseStatusPhase.Pending,
      total: this.replicas,
    }),
    new DatabaseStatusComponent({
      current: 0,
      name: DatabaseStatusComponentName.NATS,
      phase: DatabaseStatusPhase.Pending,
      total: this.replicas,
    }),
    new DatabaseStatusComponent({
      current: 0,
      name: DatabaseStatusComponentName.Sidecar,
      phase: DatabaseStatusPhase.Pending,
      total: 1,
    }),
  ];
})
export class DatabaseSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ min: 0.1, required: true })
  public cpu: number;

  public createdAt: Date;

  @prop()
  public description: string;

  @prop({ ref: 'GameSchema', validate: namespaceValidator('gameDocument', 'gameId') })
  public gameId: mongoose.Types.ObjectId;

  @prop({ min: 250 * 1000 * 1000, required: true })
  public memory: number;

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
  public status: DatabaseStatusSchema;

  @prop({ min: 5 * 1000 * 1000 * 1000, required: true, validate: decrementalValidator('storage') })
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
    memory: number,
    namespaceId: string | mongoose.Types.ObjectId,
    preemptible: boolean,
    replicas: number,
    storage: number,
  ) {}

  /**
   * Returns true if a restart is required on an update.
   */
  public static isRestartRequired(fields: string[]) {
    const immutableFields = ['cpu', 'memory', 'preemptible', 'replicas', 'restartedAt', 'storage'];
    return immutableFields.some((i) => fields.includes(i));
  }
}

export type DatabaseDocument = DocumentType<DatabaseSchema>;
export type DatabaseModel = ReturnModelType<typeof DatabaseSchema>;
export const Database = getModelForClass(DatabaseSchema);

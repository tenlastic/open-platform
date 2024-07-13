import {
  DocumentType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  pre,
  prop,
  PropType,
  Severity,
} from '@typegoose/typegoose';
import { Chance } from 'chance';
import * as mongoose from 'mongoose';
import { unsetPlugin } from '../../plugins';

import {
  arrayLengthValidator,
  arrayMaxMinValidator,
  duplicateValidator,
  enumValidator,
} from '../../validators';
import { AuthorizationDocument } from '../authorization';
import { QueueStatusModel, QueueStatusDocument, QueueStatusSchema } from './status';
import { QueueThresholdDocument, QueueThresholdSchema } from './threshold';

@index({ namespaceId: 1 })
@modelOptions({
  options: { allowMixed: Severity.ALLOW },
  schemaOptions: { collection: 'queues', timestamps: true },
})
@plugin(unsetPlugin)
@pre('save', function (this: QueueDocument) {
  this.thresholds.sort((a, b) => (a.seconds < b.seconds ? 1 : -1));
})
export class QueueSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ type: Boolean })
  public confirmation: boolean;

  @prop({ min: 0.1, required: true, type: Number })
  public cpu: number;

  public createdAt: Date;

  @prop({ maxlength: 128, trim: true, type: String })
  public description: string;

  @prop({ ref: 'GameServerTemplateSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public gameServerTemplateId: mongoose.Types.ObjectId;

  @prop({ default: 30, min: 0, type: Number })
  public invitationSeconds: number;

  @prop({ min: 100 * 1000 * 1000, required: true, type: Number })
  public memory: number;

  @prop({ type: mongoose.Schema.Types.Mixed, unset: false })
  public metadata: any;

  @prop({ maxlength: 64, required: true, trim: true, type: String })
  public name: string;

  @prop({ ref: 'NamespaceSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public namespaceId: mongoose.Types.ObjectId;

  @prop({ type: Boolean })
  public preemptible: boolean;

  @prop({ min: 0, required: true, type: Number, validate: enumValidator([1, 3, 5]) })
  public replicas: number;

  @prop({ filter: { create: true, update: true }, type: Date })
  public restartedAt: Date;

  @prop({ default: () => new QueueStatusModel(), merge: true, type: QueueStatusSchema })
  public status: QueueStatusDocument;

  @prop({ type: QueueThresholdSchema, validate: duplicateValidator }, PropType.ARRAY)
  public thresholds: QueueThresholdDocument[];

  public updatedAt: Date;

  @prop(
    {
      required: true,
      type: Number,
      validate: [arrayLengthValidator(Infinity, 1), arrayMaxMinValidator(Infinity, 1)],
    },
    PropType.ARRAY,
  )
  public usersPerTeam: number[];

  @prop({ foreignField: 'namespaceId', localField: 'namespaceId', ref: 'AuthorizationSchema' })
  public authorizationDocuments: AuthorizationDocument[];

  /**
   * Returns true if a restart is required on an update.
   */
  public static isRestartRequired(fields: string[]) {
    const immutableFields = ['cpu', 'memory', 'preemptible', 'replicas', 'restartedAt'];

    return immutableFields.some((i) => fields.includes(i));
  }

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(this: typeof QueueModel, values: Partial<QueueSchema> = {}) {
    const chance = new Chance();
    const defaults = {
      cpu: chance.floating({ max: 1, min: 0.1 }),
      gameServerTemplateId: new mongoose.Types.ObjectId(),
      memory: chance.integer({ max: 1 * 1000 * 1000 * 1000, min: 100 * 1000 * 1000 }),
      name: chance.hash(),
      namespaceId: new mongoose.Types.ObjectId(),
      replicas: chance.pickone([1, 3, 5]),
      usersPerTeam: chance.integer({ min: 1 }),
    };

    return new this({ ...defaults, ...values });
  }
}

export type QueueDocument = DocumentType<QueueSchema>;
export const QueueModel = getModelForClass(QueueSchema);

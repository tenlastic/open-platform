import {
  DocumentType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  prop,
  PropType,
  Severity,
} from '@typegoose/typegoose';
import { Chance } from 'chance';
import * as mongoose from 'mongoose';
import { unsetPlugin } from '../../plugins';

import {
  arrayLengthValidator,
  arrayNullUndefinedValidator,
  duplicateValidator,
  enumValidator,
} from '../../validators';
import { AuthorizationDocument } from '../authorization';
import { QueueStatusModel, QueueStatusDocument, QueueStatusSchema } from './status';
import { QueueThresholdDocument, QueueThresholdModel, QueueThresholdSchema } from './threshold';

@index({ namespaceId: 1 })
@modelOptions({
  options: { allowMixed: Severity.ALLOW },
  schemaOptions: { collection: 'queues', timestamps: true },
})
@plugin(unsetPlugin)
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

  @prop({ type: Number })
  public initialRating: number;

  @prop({ default: 30, min: 0, type: Number })
  public invitationSeconds: number;

  @prop({ min: 1, required: true, type: Number })
  public maximumGroupSize: number;

  @prop({ min: 100 * 1000 * 1000, required: true, type: Number })
  public memory: number;

  @prop({ type: mongoose.Schema.Types.Mixed, unset: false })
  public metadata: any;

  @prop({ min: 1, required: true, type: Number })
  public minimumGroupSize: number;

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

  @prop({ type: Boolean })
  public teams: boolean;

  @prop(
    {
      required: true,
      type: QueueThresholdSchema,
      validate: [
        arrayLengthValidator(Infinity, 1),
        arrayNullUndefinedValidator,
        duplicateValidator,
      ],
    },
    PropType.ARRAY,
  )
  public thresholds: QueueThresholdDocument[];

  public updatedAt: Date;

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
      maximumGroupSize: 1,
      memory: chance.integer({ max: 1 * 1000 * 1000 * 1000, min: 100 * 1000 * 1000 }),
      minimumGroupSize: 1,
      name: chance.hash(),
      namespaceId: new mongoose.Types.ObjectId(),
      replicas: chance.pickone([1, 3, 5]),
      thresholds: [QueueThresholdModel.mock()],
    };

    return new this({ ...defaults, ...values });
  }
}

export type QueueDocument = DocumentType<QueueSchema>;
export const QueueModel = getModelForClass(QueueSchema);

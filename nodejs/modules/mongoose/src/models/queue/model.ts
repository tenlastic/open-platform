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
import { QueueStatusDocument, QueueStatusModel, QueueStatusSchema } from './status';
import { QueueThresholdDocument, QueueThresholdModel, QueueThresholdSchema } from './threshold';

export interface Queue {
  _id: mongoose.Types.ObjectId;
  authorizationDocuments?: AuthorizationDocument[];
  confirmation?: boolean;
  cpu: number;
  createdAt?: Date;
  description?: string;
  gameServerTemplateId: mongoose.Types.ObjectId;
  groupSizes: number[];
  initialRating?: number;
  invitationSeconds?: number;
  memory: number;
  metadata?: unknown;
  name: string;
  namespaceId: mongoose.Types.ObjectId;
  preemptible?: boolean;
  replicas: number;
  restartedAt?: Date;
  status: QueueStatusDocument;
  teams?: boolean;
  thresholds: QueueThresholdDocument[];
  updatedAt?: Date;
}

export type QueueDocument = mongoose.Document<mongoose.Types.ObjectId> & Queue;

export interface QueueModelType extends mongoose.Model<QueueDocument> {
  /**
   * Returns true if a restart is required on an update.
   */
  isRestartRequired(fields: string[]): boolean;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(this: QueueModelType, values?: Partial<Queue>): QueueDocument;
}

const QueueSchema = new mongoose.Schema<QueueDocument, QueueModelType>(
  {
    confirmation: { type: Boolean },
    cpu: { min: 0.1, required: true, type: Number },
    description: { maxlength: 128, trim: true, type: String },
    gameServerTemplateId: {
      ref: 'GameServerTemplateSchema',
      required: true,
      type: mongoose.Schema.Types.ObjectId,
    },
    groupSizes: {
      required: true,
      type: [Number],
      validate: [arrayLengthValidator(Infinity, 1), arrayNullUndefinedValidator],
    },
    initialRating: { type: Number },
    invitationSeconds: { default: 30, min: 0, type: Number },
    memory: { min: 100 * 1000 * 1000, required: true, type: Number },
    metadata: { type: mongoose.Schema.Types.Mixed, unset: false },
    name: { maxlength: 64, required: true, trim: true, type: String },
    namespaceId: { ref: 'NamespaceSchema', required: true, type: mongoose.Schema.Types.ObjectId },
    preemptible: { type: Boolean },
    replicas: { min: 0, required: true, type: Number, validate: enumValidator([1, 3, 5]) },
    restartedAt: { type: Date },
    status: { default: () => new QueueStatusModel(), merge: true, type: QueueStatusSchema },
    teams: { type: Boolean },
    thresholds: {
      required: true,
      type: [QueueThresholdSchema],
      validate: [
        arrayLengthValidator(Infinity, 1),
        arrayNullUndefinedValidator,
        duplicateValidator,
      ],
    },
  },
  { collection: 'queues', timestamps: true },
);

QueueSchema.index({ namespaceId: 1 });

QueueSchema.plugin(unsetPlugin);

QueueSchema.virtual('authorizationDocuments', {
  ref: 'AuthorizationSchema',
  localField: 'namespaceId',
  foreignField: 'namespaceId',
});

QueueSchema.statics.isRestartRequired = function (fields: string[]) {
  const immutableFields = ['cpu', 'memory', 'preemptible', 'replicas', 'restartedAt'];

  return immutableFields.some((i) => fields.includes(i));
};

QueueSchema.statics.mock = function (values: Partial<Queue> = {}) {
  const chance = new Chance();
  const defaults: Partial<Queue> = {
    cpu: chance.floating({ max: 1, min: 0.1 }),
    gameServerTemplateId: new mongoose.Types.ObjectId(),
    groupSizes: [1],
    memory: chance.integer({ max: 1 * 1000 * 1000 * 1000, min: 100 * 1000 * 1000 }),
    name: chance.hash(),
    namespaceId: new mongoose.Types.ObjectId(),
    replicas: chance.pickone([1, 3, 5]),
    thresholds: [QueueThresholdModel.mock()],
  };

  return new this({ ...defaults, ...values });
};

export const QueueModel = mongoose.model<QueueDocument, QueueModelType>('QueueSchema', QueueSchema);

export { QueueSchema };

export default QueueModel;

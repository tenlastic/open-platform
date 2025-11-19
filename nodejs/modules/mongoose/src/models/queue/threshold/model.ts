import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { arrayLengthValidator, arrayMaxMinValidator } from '../../../validators';

export interface QueueThreshold {
  rating?: number;
  seconds?: number;
  usersPerTeam: number[];
}

export type QueueThresholdDocument = mongoose.Document<mongoose.Types.ObjectId> & QueueThreshold;

export interface QueueThresholdModelType extends mongoose.Model<QueueThresholdDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(this: QueueThresholdModelType, values?: Partial<QueueThreshold>): QueueThresholdDocument;
}

const QueueThresholdSchema = new mongoose.Schema<QueueThresholdDocument, QueueThresholdModelType>(
  {
    rating: { type: Number },
    seconds: { default: 0, type: Number },
    usersPerTeam: {
      required: true,
      type: [Number],
      validate: [arrayLengthValidator(Infinity, 1), arrayMaxMinValidator(Infinity, 1)],
    },
  },
  { _id: false },
);

QueueThresholdSchema.statics.mock = function (values: Partial<QueueThreshold> = {}) {
  const chance = new Chance();
  const defaults: Partial<QueueThreshold> = {
    usersPerTeam: [chance.integer({ max: 10, min: 1 }), chance.integer({ max: 10, min: 1 })],
  };

  return new this({ ...defaults, ...values });
};

export const QueueThresholdModel = mongoose.model<QueueThresholdDocument, QueueThresholdModelType>(
  'QueueThresholdSchema',
  QueueThresholdSchema,
);

export { QueueThresholdSchema };

export default QueueThresholdModel;

import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { QueueStatusComponentName, QueueStatusPhase } from '../types';

export interface QueueStatusComponent {
  current?: number;
  name: QueueStatusComponentName;
  phase?: QueueStatusPhase;
  total?: number;
}

export type QueueStatusComponentDocument = mongoose.Document<mongoose.Types.ObjectId> &
  QueueStatusComponent;

export interface QueueStatusComponentModelType
  extends mongoose.Model<QueueStatusComponentDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(
    this: QueueStatusComponentModelType,
    values?: Partial<QueueStatusComponent>,
  ): QueueStatusComponentDocument;
}

const QueueStatusComponentSchema = new mongoose.Schema<
  QueueStatusComponentDocument,
  QueueStatusComponentModelType
>(
  {
    current: { type: Number },
    name: { enum: Object.values(QueueStatusComponentName), required: true, type: String },
    phase: {
      default: () => QueueStatusPhase.Pending,
      enum: Object.values(QueueStatusPhase),
      type: String,
    },
    total: { type: Number },
  },
  { _id: false },
);

QueueStatusComponentSchema.statics.mock = function (values: Partial<QueueStatusComponent> = {}) {
  const chance = new Chance();
  const defaults: Partial<QueueStatusComponent> = {
    current: chance.integer({ min: 0 }),
    name: QueueStatusComponentName.Application,
    phase: QueueStatusPhase.Running,
    total: chance.integer({ min: 0 }),
  };

  return new this({ ...defaults, ...values });
};

export const QueueStatusComponentModel = mongoose.model<
  QueueStatusComponentDocument,
  QueueStatusComponentModelType
>('QueueStatusComponentSchema', QueueStatusComponentSchema);

export { QueueStatusComponentSchema };

export default QueueStatusComponentModel;

import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { QueueStatusComponentName, QueueStatusPhase } from '../types';

export interface QueueStatusNode {
  component: QueueStatusComponentName;
  container: string;
  phase?: QueueStatusPhase;
  pod: string;
}

export type QueueStatusNodeDocument = mongoose.Document<mongoose.Types.ObjectId> & QueueStatusNode;

export interface QueueStatusNodeModelType extends mongoose.Model<QueueStatusNodeDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(this: QueueStatusNodeModelType, values?: Partial<QueueStatusNode>): QueueStatusNodeDocument;
}

const QueueStatusNodeSchema = new mongoose.Schema<
  QueueStatusNodeDocument,
  QueueStatusNodeModelType
>(
  {
    component: { enum: Object.values(QueueStatusComponentName), required: true, type: String },
    container: { required: true, type: String },
    phase: {
      default: () => QueueStatusPhase.Pending,
      enum: Object.values(QueueStatusPhase),
      type: String,
    },
    pod: { required: true, type: String },
  },
  { _id: false },
);

QueueStatusNodeSchema.statics.mock = function (values: Partial<QueueStatusNode> = {}) {
  const chance = new Chance();
  const defaults: Partial<QueueStatusNode> = {
    component: QueueStatusComponentName.Application,
    container: chance.hash(),
    phase: QueueStatusPhase.Running,
    pod: chance.hash(),
  };

  return new this({ ...defaults, ...values });
};

export const QueueStatusNodeModel = mongoose.model<
  QueueStatusNodeDocument,
  QueueStatusNodeModelType
>('QueueStatusNodeSchema', QueueStatusNodeSchema);

export { QueueStatusNodeSchema };

export default QueueStatusNodeModel;

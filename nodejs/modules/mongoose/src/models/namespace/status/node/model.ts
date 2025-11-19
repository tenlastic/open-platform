import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { NamespaceStatusComponentName, NamespaceStatusPhase } from '../types';

export interface NamespaceStatusNode {
  component: NamespaceStatusComponentName;
  container: string;
  phase?: NamespaceStatusPhase;
  pod: string;
}

export type NamespaceStatusNodeDocument = mongoose.Document<mongoose.Types.ObjectId> &
  NamespaceStatusNode;

export interface NamespaceStatusNodeModelType extends mongoose.Model<NamespaceStatusNodeDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(
    this: NamespaceStatusNodeModelType,
    values?: Partial<NamespaceStatusNode>,
  ): NamespaceStatusNodeDocument;
}

const NamespaceStatusNodeSchema = new mongoose.Schema<
  NamespaceStatusNodeDocument,
  NamespaceStatusNodeModelType
>(
  {
    component: { enum: Object.values(NamespaceStatusComponentName), required: true, type: String },
    container: { required: true, type: String },
    phase: {
      default: () => NamespaceStatusPhase.Pending,
      enum: Object.values(NamespaceStatusPhase),
      type: String,
    },
    pod: { required: true, type: String },
  },
  { _id: false },
);

NamespaceStatusNodeSchema.statics.mock = function (values: Partial<NamespaceStatusNode> = {}) {
  const chance = new Chance();
  const defaults: Partial<NamespaceStatusNode> = {
    component: NamespaceStatusComponentName.API,
    container: chance.hash(),
    phase: NamespaceStatusPhase.Running,
    pod: chance.hash(),
  };

  return new this({ ...defaults, ...values });
};

export const NamespaceStatusNodeModel = mongoose.model<
  NamespaceStatusNodeDocument,
  NamespaceStatusNodeModelType
>('NamespaceStatusNodeSchema', NamespaceStatusNodeSchema);

export { NamespaceStatusNodeSchema };

export default NamespaceStatusNodeModel;

import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { NamespaceStatusComponentName, NamespaceStatusPhase } from '../types';

export interface NamespaceStatusComponent {
  current?: number;
  name: NamespaceStatusComponentName;
  phase?: NamespaceStatusPhase;
  total?: number;
}

export type NamespaceStatusComponentDocument = mongoose.Document<mongoose.Types.ObjectId> &
  NamespaceStatusComponent;

export interface NamespaceStatusComponentModelType
  extends mongoose.Model<NamespaceStatusComponentDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(
    this: NamespaceStatusComponentModelType,
    values?: Partial<NamespaceStatusComponent>,
  ): NamespaceStatusComponentDocument;
}

const NamespaceStatusComponentSchema = new mongoose.Schema<
  NamespaceStatusComponentDocument,
  NamespaceStatusComponentModelType
>(
  {
    current: { type: Number },
    name: { enum: Object.values(NamespaceStatusComponentName), required: true, type: String },
    phase: {
      default: () => NamespaceStatusPhase.Pending,
      enum: Object.values(NamespaceStatusPhase),
      type: String,
    },
    total: { type: Number },
  },
  { _id: false },
);

NamespaceStatusComponentSchema.statics.mock = function (
  values: Partial<NamespaceStatusComponent> = {},
) {
  const chance = new Chance();
  const defaults: Partial<NamespaceStatusComponent> = {
    current: chance.integer({ min: 0 }),
    name: NamespaceStatusComponentName.API,
    phase: NamespaceStatusPhase.Running,
    total: chance.integer({ min: 0 }),
  };

  return new this({ ...defaults, ...values });
};

export const NamespaceStatusComponentModel = mongoose.model<
  NamespaceStatusComponentDocument,
  NamespaceStatusComponentModelType
>('NamespaceStatusComponentSchema', NamespaceStatusComponentSchema);

export { NamespaceStatusComponentSchema };

export default NamespaceStatusComponentModel;

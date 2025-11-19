import { Chance } from 'chance';
import * as mongoose from 'mongoose';

export interface WorkflowSpecParameter {
  name: string;
  value: string;
}

export interface WorkflowSpecParameterDocument
  extends mongoose.Document<mongoose.Types.ObjectId>,
    WorkflowSpecParameter {}

export interface WorkflowSpecParameterModelType
  extends mongoose.Model<WorkflowSpecParameterDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(
    this: WorkflowSpecParameterModelType,
    values?: Partial<WorkflowSpecParameter>,
  ): WorkflowSpecParameterDocument;
}

export const WorkflowSpecParameterSchema = new mongoose.Schema<WorkflowSpecParameterDocument>(
  {
    name: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false },
);

WorkflowSpecParameterSchema.statics.mock = function (
  this: WorkflowSpecParameterModelType,
  values: Partial<WorkflowSpecParameter> = {},
) {
  const chance = new Chance();
  const defaults = { name: chance.hash(), value: chance.hash() };

  return new this({ ...defaults, ...values });
};

export const WorkflowSpecParameterModel = mongoose.model<
  WorkflowSpecParameterDocument,
  WorkflowSpecParameterModelType
>('WorkflowSpecParameter', WorkflowSpecParameterSchema);

import { Chance } from 'chance';
import * as mongoose from 'mongoose';

export interface WorkflowSpecEnv {
  name: string;
  value: string;
}

export interface WorkflowSpecEnvDocument
  extends mongoose.Document<mongoose.Types.ObjectId>,
    WorkflowSpecEnv {}

export interface WorkflowSpecEnvModelType extends mongoose.Model<WorkflowSpecEnvDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(this: WorkflowSpecEnvModelType, values?: Partial<WorkflowSpecEnv>): WorkflowSpecEnvDocument;
}

export const WorkflowSpecEnvSchema = new mongoose.Schema<WorkflowSpecEnvDocument>(
  {
    name: { type: String, required: true, validate: (v: string) => /[A-Z0-9_]+/.test(v) },
    value: { type: String, required: true },
  },
  { _id: false },
);

WorkflowSpecEnvSchema.statics.mock = function (
  this: WorkflowSpecEnvModelType,
  values: Partial<WorkflowSpecEnv> = {},
) {
  const chance = new Chance();
  const defaults = { name: chance.hash(), value: chance.hash() };

  return new this({ ...defaults, ...values });
};

export const WorkflowSpecEnvModel = mongoose.model<
  WorkflowSpecEnvDocument,
  WorkflowSpecEnvModelType
>('WorkflowSpecEnv', WorkflowSpecEnvSchema);

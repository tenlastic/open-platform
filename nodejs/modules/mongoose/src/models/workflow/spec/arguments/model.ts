import * as mongoose from 'mongoose';

import { WorkflowSpecParameterDocument, WorkflowSpecParameterSchema } from '../parameter';

export interface WorkflowSpecArguments {
  parameters?: WorkflowSpecParameterDocument[];
}

export interface WorkflowSpecArgumentsDocument
  extends mongoose.Document<mongoose.Types.ObjectId>,
    WorkflowSpecArguments {}

export interface WorkflowSpecArgumentsModelType
  extends mongoose.Model<WorkflowSpecArgumentsDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(
    this: WorkflowSpecArgumentsModelType,
    values?: Partial<WorkflowSpecArguments>,
  ): WorkflowSpecArgumentsDocument;
}

export const WorkflowSpecArgumentsSchema = new mongoose.Schema<WorkflowSpecArgumentsDocument>(
  {
    parameters: { type: [WorkflowSpecParameterSchema], default: undefined },
  },
  { _id: false },
);

WorkflowSpecArgumentsSchema.statics.mock = function (
  this: WorkflowSpecArgumentsModelType,
  values: Partial<WorkflowSpecArguments> = {},
) {
  const defaults = {};

  return new this({ ...defaults, ...values });
};

export const WorkflowSpecArgumentsModel = mongoose.model<
  WorkflowSpecArgumentsDocument,
  WorkflowSpecArgumentsModelType
>('WorkflowSpecArguments', WorkflowSpecArgumentsSchema);

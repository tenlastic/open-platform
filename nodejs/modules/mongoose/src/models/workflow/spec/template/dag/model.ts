import * as mongoose from 'mongoose';

import {
  WorkflowSpecTemplateDagTaskDocument,
  WorkflowSpecTemplateDagTaskModel,
  WorkflowSpecTemplateDagTaskSchema,
} from './task';

export interface WorkflowSpecTemplateDag {
  tasks: WorkflowSpecTemplateDagTaskDocument[];
}

export interface WorkflowSpecTemplateDagDocument
  extends mongoose.Document<mongoose.Types.ObjectId>,
    WorkflowSpecTemplateDag {}

export interface WorkflowSpecTemplateDagModelType
  extends mongoose.Model<WorkflowSpecTemplateDagDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(
    this: WorkflowSpecTemplateDagModelType,
    values?: Partial<WorkflowSpecTemplateDag>,
  ): WorkflowSpecTemplateDagDocument;
}

export const WorkflowSpecTemplateDagSchema = new mongoose.Schema<WorkflowSpecTemplateDagDocument>(
  {
    tasks: { type: [WorkflowSpecTemplateDagTaskSchema], required: true },
  },
  { _id: false },
);

WorkflowSpecTemplateDagSchema.statics.mock = function (
  this: WorkflowSpecTemplateDagModelType,
  values: Partial<WorkflowSpecTemplateDag> = {},
) {
  const defaults = { tasks: [WorkflowSpecTemplateDagTaskModel.mock()] };

  return new this({ ...defaults, ...values });
};

export const WorkflowSpecTemplateDagModel = mongoose.model<
  WorkflowSpecTemplateDagDocument,
  WorkflowSpecTemplateDagModelType
>('WorkflowSpecTemplateDag', WorkflowSpecTemplateDagSchema);

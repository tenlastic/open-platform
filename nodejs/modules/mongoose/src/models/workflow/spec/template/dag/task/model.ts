import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { WorkflowSpecArgumentsDocument, WorkflowSpecArgumentsSchema } from '../../../arguments';

export interface WorkflowSpecTemplateDagTask {
  arguments?: WorkflowSpecArgumentsDocument;
  dependencies?: string[];
  name: string;
  template: string;
}

export interface WorkflowSpecTemplateDagTaskDocument
  extends mongoose.Document<mongoose.Types.ObjectId>,
    WorkflowSpecTemplateDagTask {}

export interface WorkflowSpecTemplateDagTaskModelType
  extends mongoose.Model<WorkflowSpecTemplateDagTaskDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(
    this: WorkflowSpecTemplateDagTaskModelType,
    values?: Partial<WorkflowSpecTemplateDagTask>,
  ): WorkflowSpecTemplateDagTaskDocument;
}

export const WorkflowSpecTemplateDagTaskSchema =
  new mongoose.Schema<WorkflowSpecTemplateDagTaskDocument>(
    {
      arguments: { type: WorkflowSpecArgumentsSchema },
      dependencies: { type: [String], default: undefined },
      name: { type: String, required: true },
      template: { type: String, required: true },
    },
    { _id: false },
  );

WorkflowSpecTemplateDagTaskSchema.statics.mock = function (
  this: WorkflowSpecTemplateDagTaskModelType,
  values: Partial<WorkflowSpecTemplateDagTask> = {},
) {
  const chance = new Chance();
  const defaults = { name: chance.hash(), template: chance.hash() };

  return new this({ ...defaults, ...values });
};

export const WorkflowSpecTemplateDagTaskModel = mongoose.model<
  WorkflowSpecTemplateDagTaskDocument,
  WorkflowSpecTemplateDagTaskModelType
>('WorkflowSpecTemplateDagTask', WorkflowSpecTemplateDagTaskSchema);

import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { WorkflowSpecArgumentsDocument, WorkflowSpecArgumentsSchema } from './arguments';
import {
  WorkflowSpecTemplateDocument,
  WorkflowSpecTemplateModel,
  WorkflowSpecTemplateSchema,
} from './template';

export interface WorkflowSpec {
  arguments?: WorkflowSpecArgumentsDocument;
  entrypoint: string;
  parallelism?: number;
  templates: WorkflowSpecTemplateDocument[];
}

export interface WorkflowSpecDocument
  extends mongoose.Document<mongoose.Types.ObjectId>,
    WorkflowSpec {}

export interface WorkflowSpecModelType extends mongoose.Model<WorkflowSpecDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(this: WorkflowSpecModelType, values?: Partial<WorkflowSpec>): WorkflowSpecDocument;
}

export const WorkflowSpecSchema = new mongoose.Schema<WorkflowSpecDocument>(
  {
    arguments: { type: WorkflowSpecArgumentsSchema, default: undefined },
    entrypoint: { type: String, required: true },
    parallelism: { type: Number, default: 1, min: 0 },
    templates: { type: [WorkflowSpecTemplateSchema], required: true },
  },
  { _id: false },
);

WorkflowSpecSchema.statics.mock = function (
  this: WorkflowSpecModelType,
  values: Partial<WorkflowSpec> = {},
) {
  const chance = new Chance();
  const defaults = { entrypoint: chance.hash(), templates: [WorkflowSpecTemplateModel.mock()] };

  return new this({ ...defaults, ...values });
};

export const WorkflowSpecModel = mongoose.model<WorkflowSpecDocument, WorkflowSpecModelType>(
  'WorkflowSpec',
  WorkflowSpecSchema,
);

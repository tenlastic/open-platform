import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { WorkflowSpecEnvDocument, WorkflowSpecEnvSchema } from '../../env';

export interface WorkflowSpecTemplateScript {
  args?: string[];
  command?: string[];
  env?: WorkflowSpecEnvDocument[];
  image: string;
  source: string;
  workingDir?: string;
}

export interface WorkflowSpecTemplateScriptDocument
  extends mongoose.Document<mongoose.Types.ObjectId>,
    WorkflowSpecTemplateScript {}

export interface WorkflowSpecTemplateScriptModelType
  extends mongoose.Model<WorkflowSpecTemplateScriptDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(
    this: WorkflowSpecTemplateScriptModelType,
    values?: Partial<WorkflowSpecTemplateScript>,
  ): WorkflowSpecTemplateScriptDocument;
}

export const WorkflowSpecTemplateScriptSchema =
  new mongoose.Schema<WorkflowSpecTemplateScriptDocument>(
    {
      args: { type: [String], default: undefined },
      command: { type: [String], default: ['sh'] },
      env: { type: [WorkflowSpecEnvSchema], default: undefined },
      image: { type: String, required: true },
      source: { type: String, required: true },
      workingDir: { type: String, default: '/workspace/' },
    },
    { _id: false },
  );

WorkflowSpecTemplateScriptSchema.statics.mock = function (
  this: WorkflowSpecTemplateScriptModelType,
  values: Partial<WorkflowSpecTemplateScript> = {},
) {
  const chance = new Chance();
  const defaults = { image: chance.hash(), source: chance.hash() };

  return new this({ ...defaults, ...values });
};

export const WorkflowSpecTemplateScriptModel = mongoose.model<
  WorkflowSpecTemplateScriptDocument,
  WorkflowSpecTemplateScriptModelType
>('WorkflowSpecTemplateScript', WorkflowSpecTemplateScriptSchema);

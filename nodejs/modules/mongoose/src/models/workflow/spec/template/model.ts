import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { WorkflowSpecTemplateDagDocument, WorkflowSpecTemplateDagSchema } from './dag';
import { WorkflowSpecTemplateInputsDocument, WorkflowSpecTemplateInputsSchema } from './inputs';
import {
  WorkflowSpecTemplateRetryStrategyDocument,
  WorkflowSpecTemplateRetryStrategySchema,
} from './retry-strategy';
import { WorkflowSpecTemplateScriptDocument, WorkflowSpecTemplateScriptSchema } from './script';
import { WorkflowSpecTemplateSidecarDocument, WorkflowSpecTemplateSidecarSchema } from './sidecar';

export interface WorkflowSpecTemplate {
  dag?: WorkflowSpecTemplateDagDocument;
  inputs?: WorkflowSpecTemplateInputsDocument;
  name: string;
  retryStrategy?: WorkflowSpecTemplateRetryStrategyDocument;
  script?: WorkflowSpecTemplateScriptDocument;
  sidecars?: WorkflowSpecTemplateSidecarDocument[];
}

export interface WorkflowSpecTemplateDocument
  extends mongoose.Document<mongoose.Types.ObjectId>,
    WorkflowSpecTemplate {}

export interface WorkflowSpecTemplateModelType
  extends mongoose.Model<WorkflowSpecTemplateDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(
    this: WorkflowSpecTemplateModelType,
    values?: Partial<WorkflowSpecTemplate>,
  ): WorkflowSpecTemplateDocument;
}

export const WorkflowSpecTemplateSchema = new mongoose.Schema<WorkflowSpecTemplateDocument>(
  {
    dag: { type: WorkflowSpecTemplateDagSchema },
    inputs: { type: WorkflowSpecTemplateInputsSchema },
    name: { type: String, required: true },
    retryStrategy: { type: WorkflowSpecTemplateRetryStrategySchema },
    script: { type: WorkflowSpecTemplateScriptSchema },
    sidecars: { type: [WorkflowSpecTemplateSidecarSchema] },
  },
  { _id: false },
);

WorkflowSpecTemplateSchema.statics.mock = function (
  this: WorkflowSpecTemplateModelType,
  values: Partial<WorkflowSpecTemplate> = {},
) {
  const chance = new Chance();
  const defaults = { name: chance.hash() };

  return new this({ ...defaults, ...values });
};

export const WorkflowSpecTemplateModel = mongoose.model<
  WorkflowSpecTemplateDocument,
  WorkflowSpecTemplateModelType
>('WorkflowSpecTemplate', WorkflowSpecTemplateSchema);

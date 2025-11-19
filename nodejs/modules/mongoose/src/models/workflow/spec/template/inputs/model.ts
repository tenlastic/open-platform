import * as mongoose from 'mongoose';

import { WorkflowSpecParameterDocument, WorkflowSpecParameterSchema } from '../../parameter';

export interface WorkflowSpecTemplateInputs {
  parameters?: WorkflowSpecParameterDocument[];
}

export interface WorkflowSpecTemplateInputsDocument
  extends mongoose.Document<mongoose.Types.ObjectId>,
    WorkflowSpecTemplateInputs {}

export interface WorkflowSpecTemplateInputsModelType
  extends mongoose.Model<WorkflowSpecTemplateInputsDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(
    this: WorkflowSpecTemplateInputsModelType,
    values?: Partial<WorkflowSpecTemplateInputs>,
  ): WorkflowSpecTemplateInputsDocument;
}

export const WorkflowSpecTemplateInputsSchema =
  new mongoose.Schema<WorkflowSpecTemplateInputsDocument>(
    {
      parameters: { type: [WorkflowSpecParameterSchema], default: undefined },
    },
    { _id: false },
  );

WorkflowSpecTemplateInputsSchema.statics.mock = function (
  this: WorkflowSpecTemplateInputsModelType,
  values: Partial<WorkflowSpecTemplateInputs> = {},
) {
  const defaults = {};

  return new this({ ...defaults, ...values });
};

export const WorkflowSpecTemplateInputsModel = mongoose.model<
  WorkflowSpecTemplateInputsDocument,
  WorkflowSpecTemplateInputsModelType
>('WorkflowSpecTemplateInputs', WorkflowSpecTemplateInputsSchema);

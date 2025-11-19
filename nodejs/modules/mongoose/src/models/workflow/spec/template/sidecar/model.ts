import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { WorkflowSpecEnvDocument, WorkflowSpecEnvSchema } from '../../env';

export interface WorkflowSpecTemplateSidecar {
  args?: string[];
  command?: string[];
  env?: WorkflowSpecEnvDocument[];
  image: string;
  name: string;
}

export type WorkflowSpecTemplateSidecarDocument = mongoose.Document<mongoose.Types.ObjectId> &
  WorkflowSpecTemplateSidecar;

export interface WorkflowSpecTemplateSidecarModelType
  extends mongoose.Model<WorkflowSpecTemplateSidecarDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(
    this: WorkflowSpecTemplateSidecarModelType,
    values?: Partial<WorkflowSpecTemplateSidecar>,
  ): WorkflowSpecTemplateSidecarDocument;
}

export const WorkflowSpecTemplateSidecarSchema =
  new mongoose.Schema<WorkflowSpecTemplateSidecarDocument>(
    {
      args: { type: [String], default: undefined },
      command: { type: [String], default: undefined },
      env: { type: [WorkflowSpecEnvSchema], default: undefined },
      image: { type: String, required: true },
      name: { type: String, required: true },
    },
    { _id: false },
  );

WorkflowSpecTemplateSidecarSchema.statics.mock = function (
  this: WorkflowSpecTemplateSidecarModelType,
  values: Partial<WorkflowSpecTemplateSidecar> = {},
) {
  const chance = new Chance();
  const defaults = { image: chance.hash(), name: chance.hash() };

  return new this({ ...defaults, ...values });
};

export const WorkflowSpecTemplateSidecarModel = mongoose.model<
  WorkflowSpecTemplateSidecarDocument,
  WorkflowSpecTemplateSidecarModelType
>('WorkflowSpecTemplateSidecar', WorkflowSpecTemplateSidecarSchema);

import { Chance } from 'chance';
import * as mongoose from 'mongoose';

export enum WorkflowSpecTemplateRetryStrategyRetryPolicy {
  OnError = 'OnError',
  OnFailure = 'OnFailure',
}

export interface WorkflowSpecTemplateRetryStrategy {
  limit: number;
  retryPolicy: WorkflowSpecTemplateRetryStrategyRetryPolicy;
}

export interface WorkflowSpecTemplateRetryStrategyDocument
  extends mongoose.Document<mongoose.Types.ObjectId>,
    WorkflowSpecTemplateRetryStrategy {}

export interface WorkflowSpecTemplateRetryStrategyModelType
  extends mongoose.Model<WorkflowSpecTemplateRetryStrategyDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(
    this: WorkflowSpecTemplateRetryStrategyModelType,
    values?: Partial<WorkflowSpecTemplateRetryStrategy>,
  ): WorkflowSpecTemplateRetryStrategyDocument;
}

export const WorkflowSpecTemplateRetryStrategySchema =
  new mongoose.Schema<WorkflowSpecTemplateRetryStrategyDocument>(
    {
      limit: { type: Number, required: true },
      retryPolicy: {
        type: String,
        enum: Object.values(WorkflowSpecTemplateRetryStrategyRetryPolicy),
        required: true,
      },
    },
    { _id: false },
  );

WorkflowSpecTemplateRetryStrategySchema.statics.mock = function (
  this: WorkflowSpecTemplateRetryStrategyModelType,
  values: Partial<WorkflowSpecTemplateRetryStrategy> = {},
) {
  const chance = new Chance();
  const defaults = {
    limit: chance.integer({ max: 10, min: 1 }),
    retryPolicy: WorkflowSpecTemplateRetryStrategyRetryPolicy.OnError,
  };

  return new this({ ...defaults, ...values });
};

export const WorkflowSpecTemplateRetryStrategyModel = mongoose.model<
  WorkflowSpecTemplateRetryStrategyDocument,
  WorkflowSpecTemplateRetryStrategyModelType
>('WorkflowSpecTemplateRetryStrategy', WorkflowSpecTemplateRetryStrategySchema);

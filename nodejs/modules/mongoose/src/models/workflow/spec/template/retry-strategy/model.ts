import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@typegoose/typegoose';
import { Chance } from 'chance';

export enum WorkflowSpecTemplateRetryStrategyRetryPolicy {
  OnError = 'OnError',
  OnFailure = 'OnFailure',
}

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowSpecTemplateRetryStrategySchema {
  @prop({ required: true, type: Number })
  public limit: number;

  @prop({ enum: WorkflowSpecTemplateRetryStrategyRetryPolicy, required: true, type: String })
  public retryPolicy: string;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(
    this: WorkflowSpecTemplateRetryStrategyModel,
    values: Partial<WorkflowSpecTemplateRetryStrategySchema> = {},
  ) {
    const chance = new Chance();
    const defaults = {
      limit: chance.integer({ max: 10, min: 1 }),
      retryPolicy: WorkflowSpecTemplateRetryStrategyRetryPolicy.OnError,
    };

    return new this({ ...defaults, ...values });
  }
}

export type WorkflowSpecTemplateRetryStrategyDocument =
  DocumentType<WorkflowSpecTemplateRetryStrategySchema>;
export type WorkflowSpecTemplateRetryStrategyModel = ReturnModelType<
  typeof WorkflowSpecTemplateRetryStrategySchema
>;
export const WorkflowSpecTemplateRetryStrategy = getModelForClass(
  WorkflowSpecTemplateRetryStrategySchema,
);

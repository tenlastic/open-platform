import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@hasezoey/typegoose';

export enum WorkflowSpecTemplateRetryStrategyRetryPolicy {
  OnError = 'OnError',
  OnFailure = 'OnFailure',
}

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowSpecTemplateRetryStrategySchema {
  @prop({ required: true })
  public limit: number;

  @prop({ enum: WorkflowSpecTemplateRetryStrategyRetryPolicy, required: true })
  public retryPolicy: string;
}

export type WorkflowSpecTemplateRetryStrategyDocument = DocumentType<
  WorkflowSpecTemplateRetryStrategySchema
>;
export type WorkflowSpecTemplateRetryStrategyModel = ReturnModelType<
  typeof WorkflowSpecTemplateRetryStrategySchema
>;
export const WorkflowSpecTemplateRetryStrategy = getModelForClass(
  WorkflowSpecTemplateRetryStrategySchema,
);

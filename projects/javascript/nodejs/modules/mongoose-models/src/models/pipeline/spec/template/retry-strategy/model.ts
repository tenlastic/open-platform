import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@hasezoey/typegoose';

export enum PipelineSpecTemplateRetryStrategyRetryPolicy {
  OnError = 'OnError',
  OnFailure = 'OnFailure',
}

@modelOptions({ schemaOptions: { _id: false } })
export class PipelineSpecTemplateRetryStrategySchema {
  @prop({ required: true })
  public limit: number;

  @prop({ enum: PipelineSpecTemplateRetryStrategyRetryPolicy, required: true })
  public retryPolicy: string;
}

export type PipelineSpecTemplateRetryStrategyDocument = DocumentType<
  PipelineSpecTemplateRetryStrategySchema
>;
export type PipelineSpecTemplateRetryStrategyModel = ReturnModelType<
  typeof PipelineSpecTemplateRetryStrategySchema
>;
export const PipelineSpecTemplateRetryStrategy = getModelForClass(
  PipelineSpecTemplateRetryStrategySchema,
);

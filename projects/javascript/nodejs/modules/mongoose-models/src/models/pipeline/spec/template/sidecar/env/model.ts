import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@hasezoey/typegoose';

@modelOptions({ schemaOptions: { _id: false } })
export class PipelineSpecTemplateSidecarEnvSchema {
  @prop({ required: true, validate: v => /[A-Z0-9_]+/.test(v) })
  public name: string;

  @prop({ required: true })
  public value: string;
}

export type PipelineSpecTemplateSidecarEnvDocument = DocumentType<
  PipelineSpecTemplateSidecarEnvSchema
>;
export type PipelineSpecTemplateSidecarEnvModel = ReturnModelType<
  typeof PipelineSpecTemplateSidecarEnvSchema
>;
export const PipelineSpecTemplateSidecarEnv = getModelForClass(
  PipelineSpecTemplateSidecarEnvSchema,
);

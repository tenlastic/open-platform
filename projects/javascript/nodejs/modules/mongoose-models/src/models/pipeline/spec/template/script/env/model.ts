import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@hasezoey/typegoose';

@modelOptions({ schemaOptions: { _id: false } })
export class PipelineSpecTemplateScriptEnvSchema {
  @prop({ required: true })
  public name: string;

  @prop({ required: true })
  public value: string;
}

export type PipelineSpecTemplateScriptEnvDocument = DocumentType<
  PipelineSpecTemplateScriptEnvSchema
>;
export type PipelineSpecTemplateScriptEnvModel = ReturnModelType<
  typeof PipelineSpecTemplateScriptEnvSchema
>;
export const PipelineSpecTemplateScriptEnv = getModelForClass(PipelineSpecTemplateScriptEnvSchema);

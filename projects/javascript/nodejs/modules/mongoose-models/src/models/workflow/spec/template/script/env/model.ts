import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@hasezoey/typegoose';

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowSpecTemplateScriptEnvSchema {
  @prop({ required: true, validate: v => /[A-Z0-9_]+/.test(v) })
  public name: string;

  @prop({ required: true })
  public value: string;
}

export type WorkflowSpecTemplateScriptEnvDocument = DocumentType<
  WorkflowSpecTemplateScriptEnvSchema
>;
export type WorkflowSpecTemplateScriptEnvModel = ReturnModelType<
  typeof WorkflowSpecTemplateScriptEnvSchema
>;
export const WorkflowSpecTemplateScriptEnv = getModelForClass(WorkflowSpecTemplateScriptEnvSchema);

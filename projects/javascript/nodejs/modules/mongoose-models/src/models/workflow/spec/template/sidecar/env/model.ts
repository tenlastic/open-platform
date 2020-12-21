import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@hasezoey/typegoose';

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowSpecTemplateSidecarEnvSchema {
  @prop({ required: true, validate: v => /[A-Z0-9_]+/.test(v) })
  public name: string;

  @prop({ required: true })
  public value: string;
}

export type WorkflowSpecTemplateSidecarEnvDocument = DocumentType<
  WorkflowSpecTemplateSidecarEnvSchema
>;
export type WorkflowSpecTemplateSidecarEnvModel = ReturnModelType<
  typeof WorkflowSpecTemplateSidecarEnvSchema
>;
export const WorkflowSpecTemplateSidecarEnv = getModelForClass(
  WorkflowSpecTemplateSidecarEnvSchema,
);

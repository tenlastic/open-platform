import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@typegoose/typegoose';

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowSpecEnvSchema {
  @prop({ required: true, type: String, validate: (v) => /[A-Z0-9_]+/.test(v) })
  public name: string;

  @prop({ required: true, type: String })
  public value: string;
}

export type WorkflowSpecEnvDocument = DocumentType<WorkflowSpecEnvSchema>;
export type WorkflowSpecEnvModel = ReturnModelType<typeof WorkflowSpecEnvSchema>;
export const WorkflowSpecEnv = getModelForClass(WorkflowSpecEnvSchema);

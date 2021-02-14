import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@hasezoey/typegoose';

import { WorkflowSpecEnvValueFromSchema } from './value-from';

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowSpecEnvSchema {
  @prop({ required: true, validate: v => /[A-Z0-9_]+/.test(v) })
  public name: string;

  @prop({ required: true })
  public value: string;

  @prop({ required: true })
  public valueFrom: WorkflowSpecEnvValueFromSchema;
}

export type WorkflowSpecEnvDocument = DocumentType<WorkflowSpecEnvSchema>;
export type WorkflowSpecEnvModel = ReturnModelType<typeof WorkflowSpecEnvSchema>;
export const WorkflowSpecEnv = getModelForClass(WorkflowSpecEnvSchema);

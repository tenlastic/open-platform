import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

import { WorkflowSpecEnvSchema } from '../../env';

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowSpecTemplateSidecarSchema {
  @prop({ default: undefined, type: String })
  public args: string[];

  @prop({ default: undefined, type: String })
  public command: string[];

  @prop({ default: undefined, type: WorkflowSpecEnvSchema })
  public env: WorkflowSpecEnvSchema[];

  @prop({ required: true })
  public image: string;

  @prop({ required: true })
  public name: string;
}

export type WorkflowSpecTemplateSidecarDocument = DocumentType<WorkflowSpecTemplateSidecarSchema>;
export type WorkflowSpecTemplateSidecarModel = ReturnModelType<
  typeof WorkflowSpecTemplateSidecarSchema
>;
export const WorkflowSpecTemplateSidecar = getModelForClass(WorkflowSpecTemplateSidecarSchema);

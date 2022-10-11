import {
  DocumentType,
  getModelForClass,
  modelOptions,
  prop,
  PropType,
  ReturnModelType,
} from '@typegoose/typegoose';

import { WorkflowSpecEnvSchema } from '../../env';

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowSpecTemplateSidecarSchema {
  @prop({ default: undefined, type: String }, PropType.ARRAY)
  public args: string[];

  @prop({ default: undefined, type: String }, PropType.ARRAY)
  public command: string[];

  @prop({ default: undefined, type: WorkflowSpecEnvSchema }, PropType.ARRAY)
  public env: WorkflowSpecEnvSchema[];

  @prop({ required: true, type: String })
  public image: string;

  @prop({ required: true, type: String })
  public name: string;
}

export type WorkflowSpecTemplateSidecarDocument = DocumentType<WorkflowSpecTemplateSidecarSchema>;
export type WorkflowSpecTemplateSidecarModel = ReturnModelType<
  typeof WorkflowSpecTemplateSidecarSchema
>;
export const WorkflowSpecTemplateSidecar = getModelForClass(WorkflowSpecTemplateSidecarSchema);

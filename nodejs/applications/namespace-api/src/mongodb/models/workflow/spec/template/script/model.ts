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
export class WorkflowSpecTemplateScriptSchema {
  @prop({ default: undefined, type: String }, PropType.ARRAY)
  public args: string[];

  @prop({ default: ['sh'], type: String }, PropType.ARRAY)
  public command: string[];

  @prop({ default: undefined, type: WorkflowSpecEnvSchema }, PropType.ARRAY)
  public env: WorkflowSpecEnvSchema[];

  @prop({ required: true, type: String })
  public image: string;

  @prop({ required: true, type: String })
  public source: string;

  @prop({ default: '/workspace/', type: String })
  public workingDir: string;
}

export type WorkflowSpecTemplateScriptDocument = DocumentType<WorkflowSpecTemplateScriptSchema>;
export type WorkflowSpecTemplateScriptModel = ReturnModelType<
  typeof WorkflowSpecTemplateScriptSchema
>;
export const WorkflowSpecTemplateScript = getModelForClass(WorkflowSpecTemplateScriptSchema);

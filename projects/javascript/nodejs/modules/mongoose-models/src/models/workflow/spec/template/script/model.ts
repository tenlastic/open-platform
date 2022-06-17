import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@typegoose/typegoose';

import { WorkflowSpecEnvSchema } from '../../env';

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowSpecTemplateScriptSchema {
  @prop({ default: undefined, type: String })
  public args: string[];

  @prop({ default: ['sh'], type: String })
  public command: string[];

  @prop({ default: undefined, type: WorkflowSpecEnvSchema })
  public env: WorkflowSpecEnvSchema[];

  @prop({ required: true })
  public image: string;

  @prop({ required: true })
  public source: string;

  @prop({ default: '/workspace/' })
  public workingDir: string;
}

export type WorkflowSpecTemplateScriptDocument = DocumentType<WorkflowSpecTemplateScriptSchema>;
export type WorkflowSpecTemplateScriptModel = ReturnModelType<
  typeof WorkflowSpecTemplateScriptSchema
>;
export const WorkflowSpecTemplateScript = getModelForClass(WorkflowSpecTemplateScriptSchema);

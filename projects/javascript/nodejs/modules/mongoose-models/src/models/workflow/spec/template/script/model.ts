import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
  arrayProp,
} from '@typegoose/typegoose';

import { WorkflowSpecEnvSchema } from '../../env';

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowSpecTemplateScriptSchema {
  @arrayProp({ default: undefined, items: String })
  public args: string[];

  @arrayProp({ default: ['sh'], items: String })
  public command: string[];

  @arrayProp({ default: undefined, items: WorkflowSpecEnvSchema })
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

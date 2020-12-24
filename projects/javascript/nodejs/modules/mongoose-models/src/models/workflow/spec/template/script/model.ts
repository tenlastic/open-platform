import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
  arrayProp,
} from '@hasezoey/typegoose';

import { WorkflowSpecTemplateScriptEnv, WorkflowSpecTemplateScriptEnvDocument } from './env';

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowSpecTemplateScriptSchema {
  @arrayProp({ default: undefined, items: String })
  public args: string[];

  @arrayProp({ default: ['sh'], items: String })
  public command: string[];

  @arrayProp({ default: undefined, items: WorkflowSpecTemplateScriptEnv })
  public env: WorkflowSpecTemplateScriptEnvDocument[];

  @prop({ required: true })
  public image: string;

  @prop({ required: true })
  public source: string;

  @prop({ default: '/usr/src/app/' })
  public workingDir: string;

  @prop()
  public workspace: boolean;
}

export type WorkflowSpecTemplateScriptDocument = DocumentType<WorkflowSpecTemplateScriptSchema>;
export type WorkflowSpecTemplateScriptModel = ReturnModelType<
  typeof WorkflowSpecTemplateScriptSchema
>;
export const WorkflowSpecTemplateScript = getModelForClass(WorkflowSpecTemplateScriptSchema);
import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
  arrayProp,
} from '@hasezoey/typegoose';

import { WorkflowSpecEnvSchema } from '../../env';
import { WorkflowSpecTemplateResourcesSchema } from '../resources';

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

  @prop()
  public resources: WorkflowSpecTemplateResourcesSchema;

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

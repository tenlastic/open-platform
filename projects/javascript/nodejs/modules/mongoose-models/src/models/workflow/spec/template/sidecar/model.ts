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
export class WorkflowSpecTemplateSidecarSchema {
  @arrayProp({ default: undefined, items: String })
  public args: string[];

  @arrayProp({ default: undefined, items: String })
  public command: string[];

  @arrayProp({ default: undefined, items: WorkflowSpecEnvSchema })
  public env: WorkflowSpecEnvSchema[];

  @prop({ required: true })
  public image: string;

  @prop({ required: true })
  public name: string;

  @prop()
  public resources: WorkflowSpecTemplateResourcesSchema;
}

export type WorkflowSpecTemplateSidecarDocument = DocumentType<WorkflowSpecTemplateSidecarSchema>;
export type WorkflowSpecTemplateSidecarModel = ReturnModelType<
  typeof WorkflowSpecTemplateSidecarSchema
>;
export const WorkflowSpecTemplateSidecar = getModelForClass(WorkflowSpecTemplateSidecarSchema);

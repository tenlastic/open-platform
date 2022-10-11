import {
  DocumentType,
  getModelForClass,
  modelOptions,
  prop,
  PropType,
  ReturnModelType,
} from '@typegoose/typegoose';

import { WorkflowSpecArgumentsSchema } from './arguments';
import { WorkflowSpecTemplateSchema } from './template';

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowSpecSchema {
  @prop({ type: WorkflowSpecArgumentsSchema })
  public arguments: WorkflowSpecArgumentsSchema;

  @prop({ required: true, type: String })
  public entrypoint: string;

  @prop({ default: 1, min: 0, type: Number })
  public parallelism: number;

  @prop({ required: true, type: WorkflowSpecTemplateSchema }, PropType.ARRAY)
  public templates: WorkflowSpecTemplateSchema[];
}

export type WorkflowSpecDocument = DocumentType<WorkflowSpecSchema>;
export type WorkflowSpecModel = ReturnModelType<typeof WorkflowSpecSchema>;
export const WorkflowSpec = getModelForClass(WorkflowSpecSchema);

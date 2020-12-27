import {
  DocumentType,
  ReturnModelType,
  arrayProp,
  getModelForClass,
  modelOptions,
  prop,
} from '@hasezoey/typegoose';

import { WorkflowSpecArgumentsSchema } from './arguments';
import { WorkflowSpecTemplateSchema } from './template';

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowSpecSchema {
  @prop()
  public arguments: WorkflowSpecArgumentsSchema;

  @prop({ required: true })
  public entrypoint: string;

  @arrayProp({ items: WorkflowSpecTemplateSchema, required: true })
  public templates: WorkflowSpecTemplateSchema[];
}

export type WorkflowSpecDocument = DocumentType<WorkflowSpecSchema>;
export type WorkflowSpecModel = ReturnModelType<typeof WorkflowSpecSchema>;
export const WorkflowSpec = getModelForClass(WorkflowSpecSchema);

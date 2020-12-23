import {
  DocumentType,
  ReturnModelType,
  arrayProp,
  getModelForClass,
  modelOptions,
  prop,
} from '@hasezoey/typegoose';

import { WorkflowSpecArgumentsDocument } from './arguments';
import { WorkflowSpecTask, WorkflowSpecTaskSchema } from './task';
import { WorkflowSpecTemplate, WorkflowSpecTemplateDocument } from './template';

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowSpecSchema {
  @prop()
  public arguments: WorkflowSpecArgumentsDocument;

  @arrayProp({ items: WorkflowSpecTask, required: true })
  public tasks: WorkflowSpecTaskSchema[];

  @arrayProp({ items: WorkflowSpecTemplate, required: true })
  public templates: WorkflowSpecTemplateDocument[];
}

export type WorkflowSpecDocument = DocumentType<WorkflowSpecSchema>;
export type WorkflowSpecModel = ReturnModelType<typeof WorkflowSpecSchema>;
export const WorkflowSpec = getModelForClass(WorkflowSpecSchema);

import {
  DocumentType,
  ReturnModelType,
  arrayProp,
  getModelForClass,
  modelOptions,
} from '@hasezoey/typegoose';

import { WorkflowSpecTask, WorkflowSpecTaskSchema } from './task';
import { WorkflowSpecTemplate, WorkflowSpecTemplateDocument } from './template';

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowSpecSchema {
  @arrayProp({ items: WorkflowSpecTask, required: true })
  public tasks: WorkflowSpecTaskSchema[];

  @arrayProp({ items: WorkflowSpecTemplate, required: true })
  public templates: WorkflowSpecTemplateDocument[];
}

export type WorkflowSpecDocument = DocumentType<WorkflowSpecSchema>;
export type WorkflowSpecModel = ReturnModelType<typeof WorkflowSpecSchema>;
export const WorkflowSpec = getModelForClass(WorkflowSpecSchema);

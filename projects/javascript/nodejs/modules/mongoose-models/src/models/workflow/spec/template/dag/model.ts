import {
  DocumentType,
  ReturnModelType,
  arrayProp,
  getModelForClass,
  modelOptions,
} from '@hasezoey/typegoose';

import { WorkflowSpecTemplateDagTaskSchema } from './task';

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowSpecTemplateDagSchema {
  @arrayProp({ items: WorkflowSpecTemplateDagTaskSchema, required: true })
  public tasks: WorkflowSpecTemplateDagTaskSchema[];
}

export type WorkflowSpecTemplateDagDocument = DocumentType<WorkflowSpecTemplateDagSchema>;
export type WorkflowSpecTemplateDagModel = ReturnModelType<typeof WorkflowSpecTemplateDagSchema>;
export const WorkflowSpecTemplateDag = getModelForClass(WorkflowSpecTemplateDagSchema);

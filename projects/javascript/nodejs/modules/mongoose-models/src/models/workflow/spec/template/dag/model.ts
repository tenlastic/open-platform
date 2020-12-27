import {
  DocumentType,
  ReturnModelType,
  arrayProp,
  getModelForClass,
  modelOptions,
} from '@hasezoey/typegoose';

import { WorkflowSpecTemplateDagTask, WorkflowSpecTemplateDagTaskDocument } from './task';

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowSpecTemplateDagSchema {
  @arrayProp({ items: WorkflowSpecTemplateDagTask, required: true })
  public tasks: WorkflowSpecTemplateDagTaskDocument[];
}

export type WorkflowSpecTemplateDagDocument = DocumentType<WorkflowSpecTemplateDagSchema>;
export type WorkflowSpecTemplateDagModel = ReturnModelType<typeof WorkflowSpecTemplateDagSchema>;
export const WorkflowSpecTemplateDag = getModelForClass(WorkflowSpecTemplateDagSchema);

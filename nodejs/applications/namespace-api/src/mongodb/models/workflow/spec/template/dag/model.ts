import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@typegoose/typegoose';

import { WorkflowSpecTemplateDagTaskSchema } from './task';

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowSpecTemplateDagSchema {
  @prop({ required: true, type: WorkflowSpecTemplateDagTaskSchema })
  public tasks: WorkflowSpecTemplateDagTaskSchema[];
}

export type WorkflowSpecTemplateDagDocument = DocumentType<WorkflowSpecTemplateDagSchema>;
export type WorkflowSpecTemplateDagModel = ReturnModelType<typeof WorkflowSpecTemplateDagSchema>;
export const WorkflowSpecTemplateDag = getModelForClass(WorkflowSpecTemplateDagSchema);

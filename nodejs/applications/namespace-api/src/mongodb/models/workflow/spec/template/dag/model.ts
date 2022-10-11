import {
  DocumentType,
  getModelForClass,
  modelOptions,
  prop,
  PropType,
  ReturnModelType,
} from '@typegoose/typegoose';

import { WorkflowSpecTemplateDagTaskSchema } from './task';

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowSpecTemplateDagSchema {
  @prop({ required: true, type: WorkflowSpecTemplateDagTaskSchema }, PropType.ARRAY)
  public tasks: WorkflowSpecTemplateDagTaskSchema[];
}

export type WorkflowSpecTemplateDagDocument = DocumentType<WorkflowSpecTemplateDagSchema>;
export type WorkflowSpecTemplateDagModel = ReturnModelType<typeof WorkflowSpecTemplateDagSchema>;
export const WorkflowSpecTemplateDag = getModelForClass(WorkflowSpecTemplateDagSchema);

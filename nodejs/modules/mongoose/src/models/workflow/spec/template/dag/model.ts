import {
  DocumentType,
  getModelForClass,
  modelOptions,
  prop,
  PropType,
  ReturnModelType,
} from '@typegoose/typegoose';

import { WorkflowSpecTemplateDagTask, WorkflowSpecTemplateDagTaskSchema } from './task';

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowSpecTemplateDagSchema {
  @prop({ required: true, type: WorkflowSpecTemplateDagTaskSchema }, PropType.ARRAY)
  public tasks: WorkflowSpecTemplateDagTaskSchema[];

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(
    this: WorkflowSpecTemplateDagModel,
    values: Partial<WorkflowSpecTemplateDagSchema> = {},
  ) {
    const defaults = { tasks: [WorkflowSpecTemplateDagTask.mock()] };

    return new this({ ...defaults, ...values });
  }
}

export type WorkflowSpecTemplateDagDocument = DocumentType<WorkflowSpecTemplateDagSchema>;
export type WorkflowSpecTemplateDagModel = ReturnModelType<typeof WorkflowSpecTemplateDagSchema>;
export const WorkflowSpecTemplateDag = getModelForClass(WorkflowSpecTemplateDagSchema);

import { DocumentType, getModelForClass, modelOptions, prop, PropType } from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

import {
  WorkflowSpecTemplateDagTaskDocument,
  WorkflowSpecTemplateDagTaskModel,
  WorkflowSpecTemplateDagTaskSchema,
} from './task';

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowSpecTemplateDagSchema {
  @prop({ required: true, type: WorkflowSpecTemplateDagTaskSchema }, PropType.ARRAY)
  public tasks: WorkflowSpecTemplateDagTaskDocument[];

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(
    this: typeof WorkflowSpecTemplateDagModel,
    values: Partial<WorkflowSpecTemplateDagSchema> = {},
  ) {
    const defaults = { tasks: [WorkflowSpecTemplateDagTaskModel.mock()] };

    return new this({ ...defaults, ...values });
  }
}

export type WorkflowSpecTemplateDagDocument = DocumentType<WorkflowSpecTemplateDagSchema>;
export const WorkflowSpecTemplateDagModel = getModelForClass(WorkflowSpecTemplateDagSchema, {
  existingMongoose: mongoose,
});

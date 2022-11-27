import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
  PropType,
} from '@typegoose/typegoose';

import { WorkflowSpecParameterSchema } from '../parameter';

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowSpecArgumentsSchema {
  @prop({ type: WorkflowSpecParameterSchema }, PropType.ARRAY)
  public parameters: WorkflowSpecParameterSchema[];

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(
    this: WorkflowSpecArgumentsModel,
    values: Partial<WorkflowSpecArgumentsSchema> = {},
  ) {
    const defaults = {};

    return new this({ ...defaults, ...values });
  }
}

export type WorkflowSpecArgumentsDocument = DocumentType<WorkflowSpecArgumentsSchema>;
export type WorkflowSpecArgumentsModel = ReturnModelType<typeof WorkflowSpecArgumentsSchema>;
export const WorkflowSpecArguments = getModelForClass(WorkflowSpecArgumentsSchema);

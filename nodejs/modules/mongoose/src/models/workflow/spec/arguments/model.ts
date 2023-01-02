import { DocumentType, getModelForClass, modelOptions, prop, PropType } from '@typegoose/typegoose';

import { WorkflowSpecParameterDocument, WorkflowSpecParameterSchema } from '../parameter';

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowSpecArgumentsSchema {
  @prop({ type: WorkflowSpecParameterSchema }, PropType.ARRAY)
  public parameters: WorkflowSpecParameterDocument[];

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(
    this: typeof WorkflowSpecArgumentsModel,
    values: Partial<WorkflowSpecArgumentsSchema> = {},
  ) {
    const defaults = {};

    return new this({ ...defaults, ...values });
  }
}

export type WorkflowSpecArgumentsDocument = DocumentType<WorkflowSpecArgumentsSchema>;
export const WorkflowSpecArgumentsModel = getModelForClass(WorkflowSpecArgumentsSchema);

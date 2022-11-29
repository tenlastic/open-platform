import {
  DocumentType,
  getModelForClass,
  modelOptions,
  prop,
  PropType,
  ReturnModelType,
} from '@typegoose/typegoose';

import { WorkflowSpecParameterDocument, WorkflowSpecParameterSchema } from '../../parameter';

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowSpecTemplateInputsSchema {
  @prop({ type: WorkflowSpecParameterSchema }, PropType.ARRAY)
  public parameters: WorkflowSpecParameterDocument[];

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(
    this: WorkflowSpecTemplateInputsModel,
    values: Partial<WorkflowSpecTemplateInputsSchema> = {},
  ) {
    const defaults = {};

    return new this({ ...defaults, ...values });
  }
}

export type WorkflowSpecTemplateInputsDocument = DocumentType<WorkflowSpecTemplateInputsSchema>;
export type WorkflowSpecTemplateInputsModel = ReturnModelType<
  typeof WorkflowSpecTemplateInputsSchema
>;
export const WorkflowSpecTemplateInputs = getModelForClass(WorkflowSpecTemplateInputsSchema);

import {
  DocumentType,
  ReturnModelType,
  arrayProp,
  getModelForClass,
  modelOptions,
} from '@typegoose/typegoose';

import { WorkflowSpecParameterSchema } from '../../parameter';

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowSpecTemplateInputsSchema {
  @arrayProp({ items: WorkflowSpecParameterSchema })
  public parameters: WorkflowSpecParameterSchema[];
}

export type WorkflowSpecTemplateInputsDocument = DocumentType<WorkflowSpecTemplateInputsSchema>;
export type WorkflowSpecTemplateInputsModel = ReturnModelType<
  typeof WorkflowSpecTemplateInputsSchema
>;
export const WorkflowSpecTemplateInputs = getModelForClass(WorkflowSpecTemplateInputsSchema);

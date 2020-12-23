import {
  DocumentType,
  ReturnModelType,
  arrayProp,
  getModelForClass,
  modelOptions,
} from '@hasezoey/typegoose';

import {
  WorkflowSpecTemplateInputsParameter,
  WorkflowSpecTemplateInputsParameterDocument,
} from './parameter';

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowSpecTemplateInputsSchema {
  @arrayProp({ items: WorkflowSpecTemplateInputsParameter })
  public parameters: WorkflowSpecTemplateInputsParameterDocument[];
}

export type WorkflowSpecTemplateInputsDocument = DocumentType<WorkflowSpecTemplateInputsSchema>;
export type WorkflowSpecTemplateInputsModel = ReturnModelType<
  typeof WorkflowSpecTemplateInputsSchema
>;
export const WorkflowSpecTemplateInputs = getModelForClass(WorkflowSpecTemplateInputsSchema);

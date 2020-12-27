import {
  DocumentType,
  ReturnModelType,
  arrayProp,
  getModelForClass,
  modelOptions,
} from '@hasezoey/typegoose';

import { WorkflowSpecParameter, WorkflowSpecParameterDocument } from '../../parameter';

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowSpecTemplateInputsSchema {
  @arrayProp({ items: WorkflowSpecParameter })
  public parameters: WorkflowSpecParameterDocument[];
}

export type WorkflowSpecTemplateInputsDocument = DocumentType<WorkflowSpecTemplateInputsSchema>;
export type WorkflowSpecTemplateInputsModel = ReturnModelType<
  typeof WorkflowSpecTemplateInputsSchema
>;
export const WorkflowSpecTemplateInputs = getModelForClass(WorkflowSpecTemplateInputsSchema);

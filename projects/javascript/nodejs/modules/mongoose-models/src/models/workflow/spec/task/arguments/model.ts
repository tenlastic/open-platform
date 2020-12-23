import {
  DocumentType,
  ReturnModelType,
  arrayProp,
  getModelForClass,
  modelOptions,
} from '@hasezoey/typegoose';

import {
  WorkflowSpecTaskArgumentsParameter,
  WorkflowSpecTaskArgumentsParameterDocument,
} from './parameter';

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowSpecTaskArgumentsSchema {
  @arrayProp({ items: WorkflowSpecTaskArgumentsParameter })
  public parameters: WorkflowSpecTaskArgumentsParameterDocument[];
}

export type WorkflowSpecTaskArgumentsDocument = DocumentType<WorkflowSpecTaskArgumentsSchema>;
export type WorkflowSpecTaskArgumentsModel = ReturnModelType<
  typeof WorkflowSpecTaskArgumentsSchema
>;
export const WorkflowSpecTaskArguments = getModelForClass(WorkflowSpecTaskArgumentsSchema);

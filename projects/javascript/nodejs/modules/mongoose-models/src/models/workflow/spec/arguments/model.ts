import {
  DocumentType,
  ReturnModelType,
  arrayProp,
  getModelForClass,
  modelOptions,
} from '@hasezoey/typegoose';

import {
  WorkflowSpecArgumentsParameter,
  WorkflowSpecArgumentsParameterDocument,
} from './parameter';

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowSpecArgumentsSchema {
  @arrayProp({ items: WorkflowSpecArgumentsParameter })
  public parameters: WorkflowSpecArgumentsParameterDocument[];
}

export type WorkflowSpecArgumentsDocument = DocumentType<WorkflowSpecArgumentsSchema>;
export type WorkflowSpecArgumentsModel = ReturnModelType<typeof WorkflowSpecArgumentsSchema>;
export const WorkflowSpecArguments = getModelForClass(WorkflowSpecArgumentsSchema);

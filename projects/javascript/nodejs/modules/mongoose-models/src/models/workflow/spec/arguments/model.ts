import {
  DocumentType,
  ReturnModelType,
  arrayProp,
  getModelForClass,
  modelOptions,
} from '@hasezoey/typegoose';

import { WorkflowSpecParameter, WorkflowSpecParameterDocument } from '../parameter';

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowSpecArgumentsSchema {
  @arrayProp({ items: WorkflowSpecParameter })
  public parameters: WorkflowSpecParameterDocument[];
}

export type WorkflowSpecArgumentsDocument = DocumentType<WorkflowSpecArgumentsSchema>;
export type WorkflowSpecArgumentsModel = ReturnModelType<typeof WorkflowSpecArgumentsSchema>;
export const WorkflowSpecArguments = getModelForClass(WorkflowSpecArgumentsSchema);

import {
  DocumentType,
  ReturnModelType,
  arrayProp,
  getModelForClass,
  modelOptions,
} from '@hasezoey/typegoose';

import { WorkflowSpecParameterSchema } from '../parameter';

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowSpecArgumentsSchema {
  @arrayProp({ items: WorkflowSpecParameterSchema })
  public parameters: WorkflowSpecParameterSchema[];
}

export type WorkflowSpecArgumentsDocument = DocumentType<WorkflowSpecArgumentsSchema>;
export type WorkflowSpecArgumentsModel = ReturnModelType<typeof WorkflowSpecArgumentsSchema>;
export const WorkflowSpecArguments = getModelForClass(WorkflowSpecArgumentsSchema);

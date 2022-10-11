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
}

export type WorkflowSpecArgumentsDocument = DocumentType<WorkflowSpecArgumentsSchema>;
export type WorkflowSpecArgumentsModel = ReturnModelType<typeof WorkflowSpecArgumentsSchema>;
export const WorkflowSpecArguments = getModelForClass(WorkflowSpecArgumentsSchema);

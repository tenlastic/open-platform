import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

import { WorkflowSpecParameterSchema } from '../../parameter';

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowSpecTemplateInputsSchema {
  @prop({ type: WorkflowSpecParameterSchema })
  public parameters: WorkflowSpecParameterSchema[];
}

export type WorkflowSpecTemplateInputsDocument = DocumentType<WorkflowSpecTemplateInputsSchema>;
export type WorkflowSpecTemplateInputsModel = ReturnModelType<
  typeof WorkflowSpecTemplateInputsSchema
>;
export const WorkflowSpecTemplateInputs = getModelForClass(WorkflowSpecTemplateInputsSchema);

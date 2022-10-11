import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@typegoose/typegoose';

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowSpecParameterSchema {
  @prop({ required: true, type: String })
  public name: string;

  @prop({ required: true, type: String })
  public value: string;
}

export type WorkflowSpecParameterDocument = DocumentType<WorkflowSpecParameterSchema>;
export type WorkflowSpecParameterModel = ReturnModelType<typeof WorkflowSpecParameterSchema>;
export const WorkflowSpecParameter = getModelForClass(WorkflowSpecParameterSchema);

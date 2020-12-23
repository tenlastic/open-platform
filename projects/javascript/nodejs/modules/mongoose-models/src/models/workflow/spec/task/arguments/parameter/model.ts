import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@hasezoey/typegoose';

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowSpecTaskArgumentsParameterSchema {
  @prop({ required: true })
  public name: string;

  @prop({ required: true })
  public value: string;
}

export type WorkflowSpecTaskArgumentsParameterDocument = DocumentType<
  WorkflowSpecTaskArgumentsParameterSchema
>;
export type WorkflowSpecTaskArgumentsParameterModel = ReturnModelType<
  typeof WorkflowSpecTaskArgumentsParameterSchema
>;
export const WorkflowSpecTaskArgumentsParameter = getModelForClass(
  WorkflowSpecTaskArgumentsParameterSchema,
);

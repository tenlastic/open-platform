import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@hasezoey/typegoose';

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowSpecArgumentsParameterSchema {
  @prop({ required: true })
  public name: string;

  @prop({ required: true })
  public value: string;
}

export type WorkflowSpecArgumentsParameterDocument = DocumentType<
  WorkflowSpecArgumentsParameterSchema
>;
export type WorkflowSpecArgumentsParameterModel = ReturnModelType<
  typeof WorkflowSpecArgumentsParameterSchema
>;
export const WorkflowSpecArgumentsParameter = getModelForClass(
  WorkflowSpecArgumentsParameterSchema,
);

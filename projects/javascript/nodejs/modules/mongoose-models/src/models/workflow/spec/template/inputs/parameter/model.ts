import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@hasezoey/typegoose';

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowSpecTemplateInputsParameterSchema {
  @prop({ required: true })
  public name: string;

  @prop({ required: true })
  public value: string;
}

export type WorkflowSpecTemplateInputsParameterDocument = DocumentType<
  WorkflowSpecTemplateInputsParameterSchema
>;
export type WorkflowSpecTemplateInputsParameterModel = ReturnModelType<
  typeof WorkflowSpecTemplateInputsParameterSchema
>;
export const WorkflowSpecTemplateInputsParameter = getModelForClass(
  WorkflowSpecTemplateInputsParameterSchema,
);

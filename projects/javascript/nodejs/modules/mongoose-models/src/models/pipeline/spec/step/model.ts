import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@hasezoey/typegoose';

@modelOptions({ schemaOptions: { _id: false } })
export class PipelineSpecStepSchema {
  @prop({ required: true })
  public name: string;

  @prop({ required: true })
  public template: string;
}

export type PipelineSpecStepDocument = DocumentType<PipelineSpecStepSchema>;
export type PipelineSpecStepModel = ReturnModelType<typeof PipelineSpecStepSchema>;
export const PipelineSpecStep = getModelForClass(PipelineSpecStepSchema);

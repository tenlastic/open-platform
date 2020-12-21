import {
  DocumentType,
  ReturnModelType,
  arrayProp,
  getModelForClass,
  modelOptions,
  prop,
} from '@hasezoey/typegoose';

@modelOptions({ schemaOptions: { _id: false } })
export class PipelineSpecTaskSchema {
  @arrayProp({ default: undefined, items: String })
  public dependencies: string[];

  @prop({ required: true })
  public name: string;

  @prop({ required: true })
  public template: string;
}

export type PipelineSpecTaskDocument = DocumentType<PipelineSpecTaskSchema>;
export type PipelineSpecTaskModel = ReturnModelType<typeof PipelineSpecTaskSchema>;
export const PipelineSpecTask = getModelForClass(PipelineSpecTaskSchema);

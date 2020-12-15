import {
  DocumentType,
  ReturnModelType,
  arrayProp,
  getModelForClass,
  modelOptions,
} from '@hasezoey/typegoose';

import { PipelineSpecStep, PipelineSpecStepSchema } from './step';
import { PipelineSpecTemplate, PipelineSpecTemplateDocument } from './template';

@modelOptions({ schemaOptions: { _id: false } })
export class PipelineSpecSchema {
  @arrayProp({ items: PipelineSpecStep, required: true })
  public steps: PipelineSpecStepSchema[];

  @arrayProp({ items: PipelineSpecTemplate, required: true })
  public templates: PipelineSpecTemplateDocument[];
}

export type PipelineSpecDocument = DocumentType<PipelineSpecSchema>;
export type PipelineSpecModel = ReturnModelType<typeof PipelineSpecSchema>;
export const PipelineSpec = getModelForClass(PipelineSpecSchema);

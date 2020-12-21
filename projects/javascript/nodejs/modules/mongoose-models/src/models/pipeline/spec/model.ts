import {
  DocumentType,
  ReturnModelType,
  arrayProp,
  getModelForClass,
  modelOptions,
} from '@hasezoey/typegoose';

import { PipelineSpecTask, PipelineSpecTaskSchema } from './task';
import { PipelineSpecTemplate, PipelineSpecTemplateDocument } from './template';

@modelOptions({ schemaOptions: { _id: false } })
export class PipelineSpecSchema {
  @arrayProp({ items: PipelineSpecTask, required: true })
  public tasks: PipelineSpecTaskSchema[];

  @arrayProp({ items: PipelineSpecTemplate, required: true })
  public templates: PipelineSpecTemplateDocument[];
}

export type PipelineSpecDocument = DocumentType<PipelineSpecSchema>;
export type PipelineSpecModel = ReturnModelType<typeof PipelineSpecSchema>;
export const PipelineSpec = getModelForClass(PipelineSpecSchema);

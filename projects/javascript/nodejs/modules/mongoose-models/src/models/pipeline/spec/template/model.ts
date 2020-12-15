import {
  DocumentType,
  ReturnModelType,
  arrayProp,
  getModelForClass,
  modelOptions,
  prop,
} from '@hasezoey/typegoose';

import { PipelineSpecTemplateRetryStrategyDocument } from './retry-strategy';
import { PipelineSpecTemplateScriptDocument } from './script';
import { PipelineSpecTemplateSidecar, PipelineSpecTemplateSidecarDocument } from './sidecar';

@modelOptions({ schemaOptions: { _id: false } })
export class PipelineSpecTemplateSchema {
  @prop({ required: true })
  public name: string;

  @prop()
  public retryStrategy: PipelineSpecTemplateRetryStrategyDocument;

  @prop({ required: true })
  public script: PipelineSpecTemplateScriptDocument;

  @arrayProp({ items: PipelineSpecTemplateSidecar })
  public sidecars: PipelineSpecTemplateSidecarDocument;
}

export type PipelineSpecTemplateDocument = DocumentType<PipelineSpecTemplateSchema>;
export type PipelineSpecTemplateModel = ReturnModelType<typeof PipelineSpecTemplateSchema>;
export const PipelineSpecTemplate = getModelForClass(PipelineSpecTemplateSchema);

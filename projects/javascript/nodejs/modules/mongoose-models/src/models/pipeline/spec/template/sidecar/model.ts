import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
  arrayProp,
} from '@hasezoey/typegoose';

import { PipelineSpecTemplateSidecarEnv, PipelineSpecTemplateSidecarEnvDocument } from './env';

@modelOptions({ schemaOptions: { _id: false } })
export class PipelineSpecTemplateSidecarSchema {
  @arrayProp({ default: undefined, items: String })
  public args: string[];

  @arrayProp({ default: undefined, items: String })
  public command: string[];

  @arrayProp({ default: undefined, items: PipelineSpecTemplateSidecarEnv })
  public env: PipelineSpecTemplateSidecarEnvDocument[];

  @prop({ required: true })
  public image: string;

  @prop({ required: true })
  public name: string;
}

export type PipelineSpecTemplateSidecarDocument = DocumentType<PipelineSpecTemplateSidecarSchema>;
export type PipelineSpecTemplateSidecarModel = ReturnModelType<
  typeof PipelineSpecTemplateSidecarSchema
>;
export const PipelineSpecTemplateSidecar = getModelForClass(PipelineSpecTemplateSidecarSchema);

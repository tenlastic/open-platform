import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
  arrayProp,
} from '@hasezoey/typegoose';

import { PipelineSpecTemplateScriptEnv, PipelineSpecTemplateScriptEnvDocument } from './env';

@modelOptions({ schemaOptions: { _id: false } })
export class PipelineSpecTemplateScriptSchema {
  @arrayProp({ default: undefined, items: String })
  public args: string[];

  @arrayProp({ default: ['sh'], items: String })
  public command: string[];

  @arrayProp({ default: undefined, items: PipelineSpecTemplateScriptEnv })
  public env: PipelineSpecTemplateScriptEnvDocument[];

  @prop({ required: true })
  public image: string;

  @prop({ required: true })
  public source: string;

  @prop({ default: '/usr/src/app/' })
  public workingDir: string;

  @prop()
  public workspace: boolean;
}

export type PipelineSpecTemplateScriptDocument = DocumentType<PipelineSpecTemplateScriptSchema>;
export type PipelineSpecTemplateScriptModel = ReturnModelType<
  typeof PipelineSpecTemplateScriptSchema
>;
export const PipelineSpecTemplateScript = getModelForClass(PipelineSpecTemplateScriptSchema);

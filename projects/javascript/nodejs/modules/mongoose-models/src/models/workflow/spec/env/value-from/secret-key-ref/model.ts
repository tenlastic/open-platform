import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@hasezoey/typegoose';

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowSpecEnvValueFromSecretKeyRefSchema {
  @prop({ required: true })
  public key: string;

  @prop({ required: true })
  public name: string;
}

export type WorkflowSpecEnvValueFromSecretKeyRefDocument = DocumentType<
  WorkflowSpecEnvValueFromSecretKeyRefSchema
>;
export type WorkflowSpecEnvValueFromSecretKeyRefModel = ReturnModelType<
  typeof WorkflowSpecEnvValueFromSecretKeyRefSchema
>;
export const WorkflowSpecEnvValueFromSecretKeyRef = getModelForClass(
  WorkflowSpecEnvValueFromSecretKeyRefSchema,
);

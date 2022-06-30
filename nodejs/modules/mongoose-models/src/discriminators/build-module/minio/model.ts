import {
  DocumentType,
  getModelForClass,
  modelOptions,
  prop,
  ReturnModelType,
} from '@typegoose/typegoose';

@modelOptions({ schemaOptions: { _id: false } })
export class MinioSchema {
  @prop({ default: 0.1 })
  public cpu: number;

  @prop({ default: 100 * 1000 * 1000 })
  public memory: number;

  @prop({ default: true })
  public preemptible: boolean;

  @prop({ default: 1 })
  public replicas: number;

  @prop({ default: 5 * 1000 * 1000 * 1000 })
  public storage: number;
}

export type MinioSchemaDocument = DocumentType<MinioSchema>;
export type MinioSchemaModel = ReturnModelType<typeof MinioSchema>;
export const Minio = getModelForClass(MinioSchema);

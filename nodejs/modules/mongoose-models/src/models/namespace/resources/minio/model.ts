import {
  DocumentType,
  getModelForClass,
  modelOptions,
  prop,
  ReturnModelType,
} from '@typegoose/typegoose';

@modelOptions({ schemaOptions: { _id: false } })
export class MinioSchema {
  @prop({ default: 0.1, min: 0.1 })
  public cpu: number;

  @prop({ default: 250 * 1000 * 1000, min: 250 * 1000 * 1000 })
  public memory: number;

  @prop({ default: true })
  public preemptible: boolean;

  @prop({ default: 1, enum: [1, 4, 8, 12, 16] })
  public replicas: number;

  @prop({ default: 5 * 1000 * 1000 * 1000, min: 5 * 1000 * 1000 * 1000 })
  public storage: number;
}

export type MinioSchemaDocument = DocumentType<MinioSchema>;
export type MinioSchemaModel = ReturnModelType<typeof MinioSchema>;
export const Minio = getModelForClass(MinioSchema);

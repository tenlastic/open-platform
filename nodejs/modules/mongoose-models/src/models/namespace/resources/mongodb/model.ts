import {
  DocumentType,
  getModelForClass,
  modelOptions,
  prop,
  ReturnModelType,
} from '@typegoose/typegoose';

@modelOptions({ schemaOptions: { _id: false } })
export class MongodbSchema {
  @prop({ default: 0.1, min: 0.1 })
  public cpu: number;

  @prop({ default: 250 * 1000 * 1000, min: 250 * 1000 * 1000 })
  public memory: number;

  @prop({ default: true })
  public preemptible: boolean;

  @prop({ default: 1, enum: [1, 3, 5] })
  public replicas: number;

  @prop({ default: 5 * 1000 * 1000 * 1000, min: 5 * 1000 * 1000 * 1000 })
  public storage: number;
}

export type MongodbSchemaDocument = DocumentType<MongodbSchema>;
export type MongodbSchemaModel = ReturnModelType<typeof MongodbSchema>;
export const Mongodb = getModelForClass(MongodbSchema);

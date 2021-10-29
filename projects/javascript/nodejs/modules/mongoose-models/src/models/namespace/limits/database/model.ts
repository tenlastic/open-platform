import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@typegoose/typegoose';

@modelOptions({ schemaOptions: { _id: false } })
export class NamespaceDatabaseLimitsSchema {
  @prop({ default: 0 })
  public cpu: number;

  @prop({ default: 0 })
  public memory: number;

  @prop({ default: false })
  public preemptible: boolean;

  @prop({ default: 0 })
  public replicas: number;

  @prop({ default: 0 })
  public storage: number;
}

export type NamespaceDatabaseLimitsDocument = DocumentType<NamespaceDatabaseLimitsSchema>;
export type NamespaceDatabaseLimitsModel = ReturnModelType<typeof NamespaceDatabaseLimitsSchema>;
export const NamespaceDatabaseLimits = getModelForClass(NamespaceDatabaseLimitsSchema);

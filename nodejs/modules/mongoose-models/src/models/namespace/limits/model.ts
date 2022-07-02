import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@typegoose/typegoose';

@modelOptions({ schemaOptions: { _id: false } })
export class NamespaceLimitsSchema {
  @prop({ default: 1 })
  public cpu: number;

  @prop({ default: 4 * 1000 * 1000 * 1000 })
  public memory: number;

  @prop({ default: true })
  public preemptible: boolean;

  @prop({ default: 10 * 1000 * 1000 * 1000 })
  public storage: number;
}

export type NamespaceLimitsDocument = DocumentType<NamespaceLimitsSchema>;
export type NamespaceLimitsModel = ReturnModelType<typeof NamespaceLimitsSchema>;
export const NamespaceLimits = getModelForClass(NamespaceLimitsSchema);

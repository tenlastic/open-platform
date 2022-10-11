import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@typegoose/typegoose';

@modelOptions({ schemaOptions: { _id: false } })
export class NamespaceLimitsSchema {
  @prop({ default: 0, type: Number })
  public bandwidth: number;

  @prop({ default: 0, type: Number })
  public cpu: number;

  @prop({ default: 0, type: Number })
  public memory: number;

  @prop({ default: true, type: Boolean })
  public preemptible: boolean;

  @prop({ default: 0, type: Number })
  public storage: number;
}

export type NamespaceLimitsDocument = DocumentType<NamespaceLimitsSchema>;
export type NamespaceLimitsModel = ReturnModelType<typeof NamespaceLimitsSchema>;
export const NamespaceLimits = getModelForClass(NamespaceLimitsSchema);

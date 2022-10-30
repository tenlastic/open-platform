import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@typegoose/typegoose';

@modelOptions({ schemaOptions: { _id: false } })
export class NamespaceLimitsSchema {
  @prop({ type: Number })
  public bandwidth: number;

  @prop({ type: Number })
  public cpu: number;

  @prop({ type: Number })
  public memory: number;

  @prop({ type: Boolean })
  public preemptible: boolean;

  @prop({ type: Number })
  public storage: number;
}

export type NamespaceLimitsDocument = DocumentType<NamespaceLimitsSchema>;
export type NamespaceLimitsModel = ReturnModelType<typeof NamespaceLimitsSchema>;
export const NamespaceLimits = getModelForClass(NamespaceLimitsSchema);

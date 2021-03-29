import { DocumentType, ReturnModelType, getModelForClass, prop } from '@hasezoey/typegoose';

export class NamespaceDatabaseLimitsSchema {
  @prop({ default: 0 })
  public count: number;

  @prop({ default: 0 })
  public cpu: number;

  @prop({ default: 0 })
  public memory: number;

  @prop({ default: false })
  public preemptible: boolean;
}

export type NamespaceDatabaseLimitsDocument = DocumentType<NamespaceDatabaseLimitsSchema>;
export type NamespaceDatabaseLimitsModel = ReturnModelType<typeof NamespaceDatabaseLimitsSchema>;
export const NamespaceDatabaseLimits = getModelForClass(NamespaceDatabaseLimitsSchema);

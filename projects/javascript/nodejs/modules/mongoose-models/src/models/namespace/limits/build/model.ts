import { DocumentType, ReturnModelType, getModelForClass, prop } from '@typegoose/typegoose';

export class NamespaceBuildLimitsSchema {
  @prop({ default: 0 })
  public count: number;

  @prop({ default: 0 })
  public size: number;
}

export type NamespaceBuildLimitsDocument = DocumentType<NamespaceBuildLimitsSchema>;
export type NamespaceBuildLimitsModel = ReturnModelType<typeof NamespaceBuildLimitsSchema>;
export const NamespaceBuildLimits = getModelForClass(NamespaceBuildLimitsSchema);

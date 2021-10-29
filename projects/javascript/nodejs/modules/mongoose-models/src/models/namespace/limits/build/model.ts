import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@typegoose/typegoose';

@modelOptions({ schemaOptions: { _id: false } })
export class NamespaceBuildLimitsSchema {
  @prop({ default: 0 })
  public count: number;

  @prop({ default: 0 })
  public size: number;
}

export type NamespaceBuildLimitsDocument = DocumentType<NamespaceBuildLimitsSchema>;
export type NamespaceBuildLimitsModel = ReturnModelType<typeof NamespaceBuildLimitsSchema>;
export const NamespaceBuildLimits = getModelForClass(NamespaceBuildLimitsSchema);

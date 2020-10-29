import { DocumentType, ReturnModelType, getModelForClass, prop } from '@hasezoey/typegoose';

export class NamespaceCollectionLimitsSchema {
  @prop({ default: 0 })
  public count: number;

  @prop({ default: 0 })
  public size: number;
}

export type NamespaceCollectionLimitsDocument = DocumentType<NamespaceCollectionLimitsSchema>;
export type NamespaceCollectionLimitsModel = ReturnModelType<
  typeof NamespaceCollectionLimitsSchema
>;
export const NamespaceCollectionLimits = getModelForClass(NamespaceCollectionLimitsSchema);

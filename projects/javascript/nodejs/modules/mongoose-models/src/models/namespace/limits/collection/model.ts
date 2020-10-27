import { DocumentType, ReturnModelType, getModelForClass, prop } from '@hasezoey/typegoose';

export class NamespaceCollectionLimitsSchema {
  @prop({ required: true })
  public count: number;

  @prop({ required: true })
  public size: number;
}

export type NamespaceCollectionLimitsDocument = DocumentType<NamespaceCollectionLimitsSchema>;
export type NamespaceCollectionLimitsModel = ReturnModelType<
  typeof NamespaceCollectionLimitsSchema
>;
export const NamespaceCollectionLimits = getModelForClass(NamespaceCollectionLimitsSchema);

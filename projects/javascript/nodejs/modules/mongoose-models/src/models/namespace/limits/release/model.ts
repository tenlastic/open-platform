import { DocumentType, ReturnModelType, getModelForClass, prop } from '@hasezoey/typegoose';

export class NamespaceReleaseLimitsSchema {
  @prop({ default: 0 })
  public count: number;

  @prop({ default: 0 })
  public size: number;
}

export type NamespaceReleaseLimitsDocument = DocumentType<NamespaceReleaseLimitsSchema>;
export type NamespaceReleaseLimitsModel = ReturnModelType<typeof NamespaceReleaseLimitsSchema>;
export const NamespaceReleaseLimits = getModelForClass(NamespaceReleaseLimitsSchema);

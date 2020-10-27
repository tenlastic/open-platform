import { DocumentType, ReturnModelType, getModelForClass, prop } from '@hasezoey/typegoose';

export class NamespaceReleaseLimitsSchema {
  @prop({ required: true })
  public count: number;

  @prop({ required: true })
  public size: number;
}

export type NamespaceReleaseLimitsDocument = DocumentType<NamespaceReleaseLimitsSchema>;
export type NamespaceReleaseLimitsModel = ReturnModelType<typeof NamespaceReleaseLimitsSchema>;
export const NamespaceReleaseLimits = getModelForClass(NamespaceReleaseLimitsSchema);

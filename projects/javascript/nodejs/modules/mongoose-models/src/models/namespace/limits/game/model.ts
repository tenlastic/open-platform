import { DocumentType, ReturnModelType, getModelForClass, prop } from '@hasezoey/typegoose';

export class NamespaceGameLimitsSchema {
  @prop({ default: 0 })
  public images: number;

  @prop({ default: 0 })
  public size: number;

  @prop({ default: 0 })
  public videos: number;
}

export type NamespaceGameLimitsDocument = DocumentType<NamespaceGameLimitsSchema>;
export type NamespaceGameLimitsModel = ReturnModelType<typeof NamespaceGameLimitsSchema>;
export const NamespaceGameLimits = getModelForClass(NamespaceGameLimitsSchema);

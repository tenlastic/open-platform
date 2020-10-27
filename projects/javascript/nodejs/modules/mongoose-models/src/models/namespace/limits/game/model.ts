import { DocumentType, ReturnModelType, getModelForClass, prop } from '@hasezoey/typegoose';

export class NamespaceGameLimitsSchema {
  @prop({ required: true })
  public images: number;

  @prop({ required: true })
  public size: number;

  @prop({ required: true })
  public videos: number;
}

export type NamespaceGameLimitsDocument = DocumentType<NamespaceGameLimitsSchema>;
export type NamespaceGameLimitsModel = ReturnModelType<typeof NamespaceGameLimitsSchema>;
export const NamespaceGameLimits = getModelForClass(NamespaceGameLimitsSchema);

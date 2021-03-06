import { DocumentType, ReturnModelType, getModelForClass, prop } from '@typegoose/typegoose';

export class NamespaceGameLimitsSchema {
  @prop({ default: 0 })
  public count: number;

  @prop({ default: 0 })
  public images: number;

  @prop({ default: 0 })
  public public: number;

  @prop({ default: 0 })
  public size: number;

  @prop({ default: 0 })
  public videos: number;
}

export type NamespaceGameLimitsDocument = DocumentType<NamespaceGameLimitsSchema>;
export type NamespaceGameLimitsModel = ReturnModelType<typeof NamespaceGameLimitsSchema>;
export const NamespaceGameLimits = getModelForClass(NamespaceGameLimitsSchema);

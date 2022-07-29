import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@typegoose/typegoose';

@modelOptions({ schemaOptions: { _id: false } })
export class NamespaceStorefrontLimitsSchema {
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

export type NamespaceStorefrontLimitsDocument = DocumentType<NamespaceStorefrontLimitsSchema>;
export type NamespaceStorefrontLimitsModel = ReturnModelType<
  typeof NamespaceStorefrontLimitsSchema
>;
export const NamespaceStorefrontLimits = getModelForClass(NamespaceStorefrontLimitsSchema);

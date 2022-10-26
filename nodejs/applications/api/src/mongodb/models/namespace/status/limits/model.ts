import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@typegoose/typegoose';

@modelOptions({ schemaOptions: { _id: false } })
export class NamespaceStatusLimitsSchema {
  @prop({ type: Number })
  public bandwidth: number;

  @prop({ type: Number })
  public cpu: number;

  @prop({ type: Number })
  public memory: number;

  @prop({ type: Number })
  public storage: number;
}

export type NamespaceStatusLimitsDocument = DocumentType<NamespaceStatusLimitsSchema>;
export type NamespaceStatusLimitsModel = ReturnModelType<typeof NamespaceStatusLimitsSchema>;
export const NamespaceStatusLimits = getModelForClass(NamespaceStatusLimitsSchema);

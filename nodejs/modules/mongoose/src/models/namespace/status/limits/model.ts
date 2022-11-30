import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@typegoose/typegoose';

@modelOptions({ schemaOptions: { _id: false } })
export class NamespaceStatusLimitsSchema {
  @prop({ default: 0, type: Number })
  public bandwidth: number;

  @prop({ default: 0, type: Number })
  public cpu: number;

  @prop({ default: 0, type: Number })
  public memory: number;

  @prop({ default: 0, type: Number })
  public storage: number;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(
    this: NamespaceStatusLimitsModel,
    values: Partial<NamespaceStatusLimitsSchema> = {},
  ) {
    const defaults = {};

    return new this({ ...defaults, ...values });
  }
}

export type NamespaceStatusLimitsDocument = DocumentType<NamespaceStatusLimitsSchema>;
export type NamespaceStatusLimitsModel = ReturnModelType<typeof NamespaceStatusLimitsSchema>;
export const NamespaceStatusLimits = getModelForClass(NamespaceStatusLimitsSchema);

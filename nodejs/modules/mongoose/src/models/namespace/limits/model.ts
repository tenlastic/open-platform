import { DocumentType, getModelForClass, modelOptions, prop } from '@typegoose/typegoose';

@modelOptions({ schemaOptions: { _id: false } })
export class NamespaceLimitsSchema {
  @prop({ default: 0, type: Number })
  public bandwidth: number;

  @prop({ default: 0, type: Number })
  public cpu: number;

  @prop({ default: false, type: Boolean })
  public defaultAuthorization: boolean;

  @prop({ default: 0, type: Number })
  public memory: number;

  @prop({ default: false, type: Boolean })
  public nonPreemptible: boolean;

  @prop({ default: 0, type: Number })
  public storage: number;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(
    this: typeof NamespaceLimitsModel,
    values: Partial<NamespaceLimitsSchema> = {},
  ) {
    const defaults = { defaultAuthorization: true, nonPreemptible: true };

    return new this({ ...defaults, ...values });
  }
}

export type NamespaceLimitsDocument = DocumentType<NamespaceLimitsSchema>;
export const NamespaceLimitsModel = getModelForClass(NamespaceLimitsSchema);

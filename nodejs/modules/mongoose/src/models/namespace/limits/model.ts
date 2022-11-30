import {
  DocumentType,
  getModelForClass,
  modelOptions,
  prop,
  ReturnModelType,
} from '@typegoose/typegoose';

@modelOptions({ schemaOptions: { _id: false } })
export class NamespaceLimitsSchema {
  @prop({ type: Number })
  public bandwidth: number;

  @prop({ type: Number })
  public cpu: number;

  @prop({ type: Boolean })
  public defaultAuthorization: boolean;

  @prop({ type: Number })
  public memory: number;

  @prop({ type: Boolean })
  public nonPreemptible: boolean;

  @prop({ type: Number })
  public storage: number;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(this: NamespaceLimitsModel, values: Partial<NamespaceLimitsSchema> = {}) {
    const defaults = { defaultAuthorization: true, nonPreemptible: true };

    return new this({ ...defaults, ...values });
  }
}

export type NamespaceLimitsDocument = DocumentType<NamespaceLimitsSchema>;
export type NamespaceLimitsModel = ReturnModelType<typeof NamespaceLimitsSchema>;
export const NamespaceLimits = getModelForClass(NamespaceLimitsSchema);

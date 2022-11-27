import {
  DocumentType,
  getModelForClass,
  modelOptions,
  prop,
  ReturnModelType,
} from '@typegoose/typegoose';

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

  @prop({ default: true, type: Boolean })
  public preemptible: boolean;

  @prop({ default: 0, type: Number })
  public storage: number;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(this: NamespaceLimitsModel, values: Partial<NamespaceLimitsSchema> = {}) {
    const defaults = { defaultAuthorization: true, preemptible: false };

    return new this({ ...defaults, ...values });
  }
}

export type NamespaceLimitsDocument = DocumentType<NamespaceLimitsSchema>;
export type NamespaceLimitsModel = ReturnModelType<typeof NamespaceLimitsSchema>;
export const NamespaceLimits = getModelForClass(NamespaceLimitsSchema);

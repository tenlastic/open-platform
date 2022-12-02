import { DocumentType, getModelForClass, modelOptions, prop, Severity } from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

@modelOptions({ options: { allowMixed: Severity.ALLOW }, schemaOptions: { _id: false } })
export class CollectionIndexOptionsSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ type: Number })
  public expireAfterSeconds: number;

  @prop({ type: mongoose.Schema.Types.Mixed, unset: false })
  public partialFilterExpression: any;

  @prop({ type: Boolean })
  public unique: boolean;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(
    this: typeof CollectionIndexOptionsModel,
    values: Partial<CollectionIndexOptionsSchema> = {},
  ) {
    const defaults = {};

    return new this({ ...defaults, ...values });
  }
}

export type CollectionIndexOptionsDocument = DocumentType<CollectionIndexOptionsSchema>;
export const CollectionIndexOptionsModel = getModelForClass(CollectionIndexOptionsSchema);

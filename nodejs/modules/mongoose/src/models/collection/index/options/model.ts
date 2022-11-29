import {
  DocumentType,
  getModelForClass,
  modelOptions,
  prop,
  ReturnModelType,
  Severity,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

@modelOptions({
  options: { allowMixed: Severity.ALLOW },
  schemaOptions: { _id: false, minimize: false },
})
export class CollectionIndexOptionsSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ type: Number })
  public expireAfterSeconds: number;

  @prop({ type: mongoose.Schema.Types.Mixed })
  public partialFilterExpression: any;

  @prop({ type: Boolean })
  public unique: boolean;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(
    this: CollectionIndexOptionsModel,
    values: Partial<CollectionIndexOptionsSchema> = {},
  ) {
    const defaults = {};

    return new this({ ...defaults, ...values });
  }
}

export type CollectionIndexOptionsDocument = DocumentType<CollectionIndexOptionsSchema>;
export type CollectionIndexOptionsModel = ReturnModelType<typeof CollectionIndexOptionsSchema>;
export const CollectionIndexOptions = getModelForClass(CollectionIndexOptionsSchema);

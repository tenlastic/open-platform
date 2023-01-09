import { DocumentType, getModelForClass, modelOptions, prop, Severity } from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

import { parseValue, stringifyValue } from '../../../../transforms';
import {
  CollectionIndexOptionsCollationDocument,
  CollectionIndexOptionsCollationSchema,
} from './collation';

@modelOptions({
  options: { allowMixed: Severity.ALLOW },
  schemaOptions: { _id: false, toJSON: { getters: true }, toObject: { getters: true } },
})
export class CollectionIndexOptionsSchema {
  @prop({ type: CollectionIndexOptionsCollationSchema })
  public collation: CollectionIndexOptionsCollationDocument;

  @prop({ type: Number })
  public expireAfterSeconds: number;

  @prop({
    get: (value) => parseValue(value),
    set: (value) => stringifyValue(value),
    type: mongoose.Schema.Types.Mixed,
  })
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
export const CollectionIndexOptionsModel = getModelForClass(CollectionIndexOptionsSchema, {
  existingMongoose: mongoose,
});

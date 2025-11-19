import * as mongoose from 'mongoose';

import { parseValue, stringifyValue } from '../../../../transforms';
import {
  CollectionIndexOptionsCollationDocument,
  CollectionIndexOptionsCollationSchema,
} from './collation';

export interface CollectionIndexOptions {
  collation?: CollectionIndexOptionsCollationDocument;
  expireAfterSeconds?: number;
  partialFilterExpression?: mongoose.FilterQuery<mongoose.Document>;
  unique?: boolean;
}

export type CollectionIndexOptionsDocument = mongoose.Document<mongoose.Types.ObjectId> &
  CollectionIndexOptions;

export interface CollectionIndexOptionsModelType
  extends mongoose.Model<CollectionIndexOptionsDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(
    this: CollectionIndexOptionsModelType,
    values?: Partial<CollectionIndexOptions>,
  ): CollectionIndexOptionsDocument;
}

const CollectionIndexOptionsSchema = new mongoose.Schema<CollectionIndexOptionsDocument>(
  {
    collation: { type: CollectionIndexOptionsCollationSchema },
    expireAfterSeconds: { type: Number },
    partialFilterExpression: {
      get: (value: unknown) => parseValue(value),
      set: (value: unknown) => stringifyValue(value),
      type: mongoose.Schema.Types.Mixed,
    },
    unique: { type: Boolean },
  },
  {
    _id: false,
    minimize: false,
  },
);

CollectionIndexOptionsSchema.statics = CollectionIndexOptionsSchema.statics || {};
CollectionIndexOptionsSchema.statics.mock = function (
  values: Partial<CollectionIndexOptions> = {},
) {
  const defaults: Partial<CollectionIndexOptions> = {};

  return new this({ ...defaults, ...values });
};

export const CollectionIndexOptionsModel = mongoose.model<
  CollectionIndexOptionsDocument,
  CollectionIndexOptionsModelType
>('CollectionIndexOptionsSchema', CollectionIndexOptionsSchema);

export { CollectionIndexOptionsSchema };

export default CollectionIndexOptionsModel;

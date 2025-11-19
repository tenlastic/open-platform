import { Chance } from 'chance';
import * as mongoose from 'mongoose';

export interface CollectionIndexKey {
  direction?: number;
  field: string;
}

export type CollectionIndexKeyDocument = mongoose.Document<mongoose.Types.ObjectId> &
  CollectionIndexKey;

export interface CollectionIndexKeyModelType extends mongoose.Model<CollectionIndexKeyDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(
    this: CollectionIndexKeyModelType,
    values?: Partial<CollectionIndexKey>,
  ): CollectionIndexKeyDocument;
}

const CollectionIndexKeySchema = new mongoose.Schema<
  CollectionIndexKeyDocument,
  CollectionIndexKeyModelType
>(
  {
    direction: { default: 1, type: Number },
    field: { match: /^[0-9A-Za-z.]+$/, maxlength: 64, required: true, trim: true, type: String },
  },
  { _id: false },
);

CollectionIndexKeySchema.statics.mock = function (values: Partial<CollectionIndexKey> = {}) {
  const chance = new Chance();
  const defaults: Partial<CollectionIndexKey> = { field: chance.hash() };

  return new this({ ...defaults, ...values });
};

export const CollectionIndexKeyModel = mongoose.model<
  CollectionIndexKeyDocument,
  CollectionIndexKeyModelType
>('CollectionIndexKeySchema', CollectionIndexKeySchema);

export { CollectionIndexKeySchema };

export default CollectionIndexKeyModel;

import * as mongoose from 'mongoose';

import { setPlugin } from '../../../plugins';
import {
  CollectionIndexKeyDocument,
  CollectionIndexKeyModel,
  CollectionIndexKeySchema,
} from './key';
import { CollectionIndexOptionsDocument, CollectionIndexOptionsSchema } from './options';

export interface CollectionIndex {
  _id: mongoose.Types.ObjectId;
  keys: CollectionIndexKeyDocument[];
  options?: CollectionIndexOptionsDocument;
}

export type CollectionIndexDocument = mongoose.Document<mongoose.Types.ObjectId> & CollectionIndex;

export interface CollectionIndexModelType extends mongoose.Model<CollectionIndexDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(this: CollectionIndexModelType, values?: Partial<CollectionIndex>): CollectionIndexDocument;
}

const CollectionIndexSchema = new mongoose.Schema<
  CollectionIndexDocument,
  CollectionIndexModelType
>({
  keys: { required: true, type: [CollectionIndexKeySchema], validate: [] },
  options: { type: CollectionIndexOptionsSchema },
});

CollectionIndexSchema.plugin(setPlugin);

CollectionIndexSchema.statics.mock = function (values: Partial<CollectionIndex> = {}) {
  const defaults: Partial<CollectionIndex> = { keys: [CollectionIndexKeyModel.mock()] };

  return new this({ ...defaults, ...values });
};

export const CollectionIndexModel = mongoose.model<
  CollectionIndexDocument,
  CollectionIndexModelType
>('CollectionIndexSchema', CollectionIndexSchema);

export { CollectionIndexSchema };

export default CollectionIndexModel;

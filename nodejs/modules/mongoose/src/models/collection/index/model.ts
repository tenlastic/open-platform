import { DocumentType, getModelForClass, plugin, prop, PropType } from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

import { setPlugin } from '../../../plugins';
import { arrayLengthValidator } from '../../../validators';
import {
  CollectionIndexKeyDocument,
  CollectionIndexKeyModel,
  CollectionIndexKeySchema,
} from './key';
import { CollectionIndexOptionsDocument, CollectionIndexOptionsSchema } from './options';

@plugin(setPlugin)
export class CollectionIndexSchema {
  public _id: mongoose.Types.ObjectId;

  @prop(
    { required: true, type: CollectionIndexKeySchema, validate: arrayLengthValidator(5, 1) },
    PropType.ARRAY,
  )
  public keys: CollectionIndexKeyDocument[];

  @prop({ type: CollectionIndexOptionsSchema })
  public options: CollectionIndexOptionsDocument;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(
    this: typeof CollectionIndexModel,
    values: Partial<CollectionIndexSchema> = {},
  ) {
    const defaults = {
      collectionId: new mongoose.Types.ObjectId(),
      keys: [CollectionIndexKeyModel.mock()],
    };

    return new this({ ...defaults, ...values });
  }
}

export type CollectionIndexDocument = DocumentType<CollectionIndexSchema>;
export const CollectionIndexModel = getModelForClass(CollectionIndexSchema);

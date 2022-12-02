import { DocumentType, getModelForClass, prop, PropType } from '@typegoose/typegoose';
import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { CollectionIndexOptionsDocument, CollectionIndexOptionsSchema } from './options';

export class CollectionIndexSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ required: true, type: Number }, PropType.MAP)
  public key: Map<string, number>;

  @prop({ type: CollectionIndexOptionsSchema })
  public options: CollectionIndexOptionsDocument;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(
    this: typeof CollectionIndexModel,
    values: Partial<CollectionIndexSchema> = {},
  ) {
    const chance = new Chance();
    const defaults = {
      collectionId: new mongoose.Types.ObjectId(),
      key: { [chance.hash()]: chance.integer({ max: 1, min: 0 }) },
    };

    return new this({ ...defaults, ...values });
  }
}

export type CollectionIndexDocument = DocumentType<CollectionIndexSchema>;
export const CollectionIndexModel = getModelForClass(CollectionIndexSchema);

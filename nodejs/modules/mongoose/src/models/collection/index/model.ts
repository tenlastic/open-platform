import {
  DocumentType,
  getModelForClass,
  modelOptions,
  prop,
  ReturnModelType,
  Severity,
} from '@typegoose/typegoose';
import { Chance } from 'chance';
import * as mongoose from 'mongoose';

export interface CollectionIndexKey {
  [s: string]: number;
}

export interface CollectionIndexOptions {
  expireAfterSeconds?: number;
  partialFilterExpression?: any;
  unique?: boolean;
}

@modelOptions({ options: { allowMixed: Severity.ALLOW }, schemaOptions: { minimize: false } })
export class CollectionIndexSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ required: true, type: mongoose.Schema.Types.Mixed })
  public key: CollectionIndexKey;

  @prop({ type: mongoose.Schema.Types.Mixed })
  public options?: CollectionIndexOptions;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(this: CollectionIndexModel, values: Partial<CollectionIndexSchema> = {}) {
    const chance = new Chance();
    const defaults = {
      collectionId: new mongoose.Types.ObjectId(),
      key: { [chance.hash()]: chance.integer({ max: 1, min: 0 }) },
    };

    return new this({ ...defaults, ...values });
  }
}

export type CollectionIndexDocument = DocumentType<CollectionIndexSchema>;
export type CollectionIndexModel = ReturnModelType<typeof CollectionIndexSchema>;
export const CollectionIndex = getModelForClass(CollectionIndexSchema);

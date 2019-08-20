import * as mongoose from 'mongoose';
import { InstanceType, ModelType, Ref, Typegoose, prop } from 'typegoose';

import { CollectionSchema } from '../collection';
import { DatabaseSchema } from '../database';

export interface IndexKey {
  [s: string]: number;
}

export interface IndexOptions {
  expireAfterSeconds?: number;
  partialFilterExpression?: any;
  unique?: boolean;
}

export class IndexSchema extends Typegoose {
  public _id: mongoose.Types.ObjectId;

  @prop({ ref: 'CollectionSchema', required: true })
  public collectionId: Ref<CollectionSchema>;

  @prop({ ref: 'DatabaseSchema', required: true })
  public databaseId: Ref<DatabaseSchema>;

  @prop({ required: true })
  public key: IndexKey;

  @prop({ default: {} })
  public options?: IndexOptions;
}

export type IndexDocument = InstanceType<IndexSchema>;
export type IndexModel = ModelType<IndexSchema>;
export const Index = new IndexSchema().getModelForClass(IndexSchema, {
  schemaOptions: {
    autoIndex: false,
    minimize: false,
    timestamps: true,
  },
});

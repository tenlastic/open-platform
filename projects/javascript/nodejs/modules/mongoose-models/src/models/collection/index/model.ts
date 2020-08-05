import {
  DocumentType,
  Ref,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@hasezoey/typegoose';
import * as mongoose from 'mongoose';

import { CollectionSchema } from '..';
import { DatabaseSchema } from '../../database';

export interface IndexKey {
  [s: string]: number;
}

export interface IndexOptions {
  expireAfterSeconds?: number;
  partialFilterExpression?: any;
  unique?: boolean;
}

@modelOptions({
  schemaOptions: {
    minimize: false,
  },
})
export class IndexSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ ref: 'CollectionSchema' })
  public collectionId: Ref<CollectionSchema>;

  @prop({ ref: 'DatabaseSchema' })
  public databaseId: Ref<DatabaseSchema>;

  @prop({ required: true })
  public key: IndexKey;

  @prop({ default: {} })
  public options?: IndexOptions;

  public async createMongoIndex() {
    return mongoose.connection.db.collection(this.collectionId.toString()).createIndex(this.key, {
      ...this.options,
      background: true,
      name: this._id.toHexString(),
    });
  }

  public deleteMongoIndex() {
    return mongoose.connection.db
      .collection(this.collectionId.toString())
      .dropIndex(this._id.toHexString());
  }
}

export type IndexDocument = DocumentType<IndexSchema>;
export type IndexModel = ReturnModelType<typeof IndexSchema>;
export const Index = getModelForClass(IndexSchema);

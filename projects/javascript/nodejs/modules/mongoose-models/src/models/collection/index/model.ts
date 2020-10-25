import {
  DocumentType,
  Ref,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@hasezoey/typegoose';
import * as mongoose from 'mongoose';

import { CollectionDocument } from '..';

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

  @prop({ ref: 'CollectionSchema', required: true })
  public collectionId: Ref<CollectionDocument>;

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

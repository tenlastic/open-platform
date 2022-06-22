import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
  Severity,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

export interface CollectionIndexKey {
  [s: string]: number;
}

export interface CollectionIndexOptions {
  expireAfterSeconds?: number;
  partialFilterExpression?: any;
  unique?: boolean;
}

@modelOptions({
  options: { allowMixed: Severity.ALLOW },
  schemaOptions: { minimize: false },
})
export class CollectionIndexSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ required: true })
  public key: CollectionIndexKey;

  @prop()
  public options?: CollectionIndexOptions;
}

export type CollectionIndexDocument = DocumentType<CollectionIndexSchema>;
export type CollectionIndexModel = ReturnModelType<typeof CollectionIndexSchema>;
export const CollectionIndex = getModelForClass(CollectionIndexSchema);
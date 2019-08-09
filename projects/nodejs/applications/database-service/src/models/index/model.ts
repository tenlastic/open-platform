import * as mongoose from 'mongoose';
import { prop } from 'typegoose';

export interface IndexKey {
  [s: string]: number;
}

export interface IndexOptions {
  expireAfterSeconds?: number;
  partialFilterExpression?: any;
  unique?: boolean;
}

export class IndexSchema {
  public _id?: mongoose.Types.ObjectId;

  @prop({ required: true })
  public key: IndexKey;

  @prop({ default: {} })
  public options?: IndexOptions;
}

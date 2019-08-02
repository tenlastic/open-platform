import * as mongoose from 'mongoose';
import { InstanceType, ModelType, Ref, Typegoose, prop } from 'typegoose';

import { DatabaseDocument, DatabaseSchema } from '../database/database.model';
import { CollectionDocument, CollectionSchema } from '../collection/collection.model';

export class RecordSchema extends Typegoose {
  public _id: mongoose.Types.ObjectId;

  @prop({ ref: 'CollectionSchema', required: true })
  public collectionId: Ref<CollectionSchema>;

  public createdAt: Date;

  @prop({ ref: 'DatabaseSchema', required: true })
  public databaseId: Ref<DatabaseSchema>;

  @prop({ required: true })
  public properties: any;

  public updatedAt: Date;

  @prop({ foreignField: '_id', justOne: true, localField: 'collectionId', overwrite: true, ref: 'CollectionSchema' })
  public get collection(): CollectionDocument {
    return this.collection;
  }

  @prop({ foreignField: '_id', justOne: true, localField: 'databaseId', overwrite: true, ref: 'DatabaseSchema' })
  public get database(): DatabaseDocument {
    return this.database;
  }
}

export type RecordDocument = InstanceType<RecordSchema>;
export type RecordModel = ModelType<RecordSchema>;
export const Record = new RecordSchema().getModelForClass(RecordSchema, {
  schemaOptions: {
    autoIndex: false,
    collection: 'records',
    timestamps: true,
  },
});

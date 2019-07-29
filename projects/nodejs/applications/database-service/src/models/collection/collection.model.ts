import * as mongoose from 'mongoose';
import { InstanceType, ModelType, Ref, Typegoose, index, prop } from 'typegoose';

import { DatabaseDocument, DatabaseSchema } from '../database/database.model';

@index({ databaseId: 1, name: 1 }, { unique: true })
export class CollectionSchema extends Typegoose {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ ref: 'DatabaseSchema', required: true })
  public databaseId: Ref<DatabaseSchema>;

  @prop({
    foreignField: '_id',
    justOne: true,
    localField: 'databaseId',
    overwrite: true,
    ref: 'DatabaseSchema',
  })
  public get database(): DatabaseDocument {
    return this.database;
  }

  @prop({ _id: false, default: {}, required: true })
  public jsonSchema: any;

  @prop({ required: 'true' })
  public name: string;

  public updatedAt: Date;
}

export type CollectionDocument = InstanceType<CollectionSchema>;
export type CollectionModel = ModelType<CollectionSchema>;
export const Collection = new CollectionSchema().getModelForClass(CollectionSchema, {
  schemaOptions: {
    autoIndex: false,
    collection: 'collections',
    timestamps: true,
  },
});

Collection.find();

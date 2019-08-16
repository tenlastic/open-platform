import * as jsonSchema from '@tenlastic/json-schema';
import * as mongoose from 'mongoose';
import { InstanceType, ModelType, Ref, Typegoose, prop } from 'typegoose';

import { DatabaseDocument, DatabaseSchema } from '../database/model';
import { CollectionDocument, CollectionSchema } from '../collection/model';

export class RecordSchema extends Typegoose {
  public _id: mongoose.Types.ObjectId;

  @prop({ ref: 'CollectionSchema', required: true })
  public collectionId: Ref<CollectionSchema>;

  public createdAt: Date;
  public customProperties: any;

  @prop({ ref: 'DatabaseSchema', required: true })
  public databaseId: Ref<DatabaseSchema>;

  public updatedAt: Date;

  @prop({
    foreignField: '_id',
    justOne: true,
    localField: 'collectionId',
    overwrite: true,
    ref: 'CollectionSchema',
  })
  public get collectionDocument(): CollectionDocument {
    return this.collectionDocument;
  }

  @prop({
    foreignField: '_id',
    justOne: true,
    localField: 'databaseId',
    overwrite: true,
    ref: 'DatabaseSchema',
  })
  public get databaseDocument(): DatabaseDocument {
    return this.databaseDocument;
  }

  public static getModelForClass(collection: CollectionDocument) {
    const Model = new RecordSchema().getModelForClass(RecordSchema);

    const customProperties = jsonSchema.toMongoose(collection.jsonSchema);
    const Schema = new mongoose.Schema(
      { customProperties },
      {
        autoIndex: false,
        collection: collection._id.toString(),
        timestamps: true,
      },
    );
    Schema.add(Model.schema);

    const name = collection._id + new Date().getTime() + Math.floor(Math.random() * 1000000000);
    return mongoose.model(name, Schema) as mongoose.Model<RecordDocument, {}> &
      RecordSchema &
      typeof RecordSchema;
  }
}

export type RecordDocument = InstanceType<RecordSchema>;
export type RecordModel = ModelType<RecordSchema>;

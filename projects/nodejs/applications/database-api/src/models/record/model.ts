import * as mongoose from 'mongoose';
import { InstanceType, ModelType, Ref, Typegoose, prop } from 'typegoose';

import { DatabaseDocument, DatabaseSchema } from '../database/model';
import { CollectionDocument, CollectionSchema } from '../collection/model';

export class RecordSchema extends Typegoose {
  public _id: mongoose.Types.ObjectId;

  @prop({ ref: 'CollectionSchema', required: true })
  public collectionId: Ref<CollectionSchema>;

  public createdAt: Date;

  @prop({ default: {}, required: true })
  public customProperties: any;

  @prop({ ref: 'DatabaseSchema', required: true })
  public databaseId: Ref<DatabaseSchema>;

  public updatedAt: Date;

  @prop({ foreignField: '_id', justOne: true, localField: 'collectionId', overwrite: true, ref: 'CollectionSchema' })
  public get collectionDocument(): CollectionDocument {
    return this.collectionDocument;
  }

  @prop({ foreignField: '_id', justOne: true, localField: 'databaseId', overwrite: true, ref: 'DatabaseSchema' })
  public get databaseDocument(): DatabaseDocument {
    return this.databaseDocument;
  }

  public static getModelForClass(collection: string) {
    return new RecordSchema().getModelForClass(RecordSchema, {
      schemaOptions: {
        autoIndex: false,
        collection,
        timestamps: true,
      },
    });
  }
}

export type RecordDocument = InstanceType<RecordSchema>;
export type RecordModel = ModelType<RecordSchema>;

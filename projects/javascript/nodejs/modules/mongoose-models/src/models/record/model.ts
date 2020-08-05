import { DocumentType, Ref, ReturnModelType, buildSchema, prop } from '@hasezoey/typegoose';
import * as jsonSchema from '@tenlastic/json-schema';
import { plugin as uniqueErrorPlugin } from '@tenlastic/mongoose-unique-error';
import * as mongoose from 'mongoose';

import { DatabaseDocument, DatabaseSchema } from '../database/model';
import { CollectionDocument, CollectionSchema } from '../collection/model';
import { UserDocument, UserSchema } from '../user/model';

export class RecordSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ ref: 'CollectionSchema', required: true })
  public collectionId: Ref<CollectionSchema>;

  public createdAt: Date;
  public properties: any;

  @prop({ ref: 'DatabaseSchema', required: true })
  public databaseId: Ref<DatabaseSchema>;

  public updatedAt: Date;

  @prop({ ref: 'UserSchema', required: true })
  public userId: Ref<UserSchema>;

  @prop({ foreignField: '_id', justOne: true, localField: 'collectionId', ref: 'CollectionSchema' })
  public collectionDocument: CollectionDocument;

  @prop({ foreignField: '_id', justOne: true, localField: 'databaseId', ref: 'DatabaseSchema' })
  public databaseDocument: DatabaseDocument;

  @prop({ foreignField: '_id', justOne: true, localField: 'userId', ref: 'UserSchema' })
  public userDocument: UserDocument;

  public static getModelForClass(collection: CollectionDocument) {
    const Schema = buildSchema(RecordSchema);

    const properties = jsonSchema.toMongoose(collection.jsonSchema);
    const schema = new mongoose.Schema(
      { properties },
      {
        autoIndex: true,
        collection: `collections.${collection._id}`,
        minimize: false,
        timestamps: true,
      },
    );
    schema.add(Schema);

    collection.indexes.forEach(i => schema.index(i.key, i.options));
    schema.plugin(uniqueErrorPlugin);

    const name = collection._id + new Date().getTime() + Math.floor(Math.random() * 1000000000);
    return mongoose.model(name, schema) as mongoose.Model<RecordDocument, {}> &
      RecordSchema &
      typeof RecordSchema;
  }
}

export type RecordDocument = DocumentType<RecordSchema>;
export type RecordModel = ReturnModelType<typeof RecordSchema>;

import { DocumentType, Ref, ReturnModelType, buildSchema, prop } from '@hasezoey/typegoose';
import * as jsonSchema from '@tenlastic/json-schema';
import { plugin as uniqueErrorPlugin } from '@tenlastic/mongoose-unique-error';
import * as mongoose from 'mongoose';

import { CollectionDocument } from '../collection/model';
import { UserDocument } from '../user/model';

let connection: mongoose.Connection;

export function createRecordConnection(connectionString: string, databaseName: string) {
  return new Promise((resolve, reject) => {
    connection = mongoose.createConnection(connectionString, {
      dbName: databaseName,
      useCreateIndex: true,
      useFindAndModify: false,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    connection.on('connected', resolve);
    connection.on('error', reject);
  });
}

export class RecordSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ ref: 'CollectionSchema', required: true })
  public collectionId: Ref<CollectionDocument>;

  public createdAt: Date;
  public properties: any;

  public updatedAt: Date;

  @prop({ ref: 'UserSchema' })
  public userId: Ref<UserDocument>;

  @prop({ foreignField: '_id', justOne: true, localField: 'collectionId', ref: 'CollectionSchema' })
  public collectionDocument: CollectionDocument;

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
    return connection.model(name, schema) as mongoose.Model<RecordDocument, {}> &
      RecordSchema &
      typeof RecordSchema;
  }
}

export type RecordDocument = DocumentType<RecordSchema>;
export type RecordModel = ReturnModelType<typeof RecordSchema>;

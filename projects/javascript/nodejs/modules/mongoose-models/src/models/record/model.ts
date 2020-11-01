import { DocumentType, Ref, ReturnModelType, buildSchema, prop } from '@hasezoey/typegoose';
import * as jsonSchema from '@tenlastic/json-schema';
import { plugin as uniqueErrorPlugin } from '@tenlastic/mongoose-unique-error';
import * as mongoose from 'mongoose';

import { CollectionDocument } from '../collection/model';
import { UserDocument } from '../user/model';

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

  public static getModelForClass(this: RecordDocument, collection: CollectionDocument) {
    // Build schema from Collection's properties.
    const Schema = buildSchema(RecordSchema);
    const schema = new mongoose.Schema(
      { properties: jsonSchema.toMongoose(collection.jsonSchema) },
      {
        autoIndex: false,
        collection: collection.collectionName,
        minimize: false,
        timestamps: true,
      },
    );
    schema.add(Schema);

    // Register schemas with Mongoose.
    collection.indexes.forEach(i => schema.index(i.key, i.options));
    schema.plugin(uniqueErrorPlugin);

    // Remove cached Model from Mongoose.
    try {
      mongoose.connection.deleteModel(collection.collectionName);
    } catch {}

    return mongoose.model(collection.collectionName, schema) as mongoose.Model<RecordDocument, {}> &
      RecordSchema &
      typeof RecordSchema;
  }
}

export type RecordDocument = DocumentType<RecordSchema>;
export type RecordModel = ReturnModelType<typeof RecordSchema>;

import {
  DocumentType,
  ReturnModelType,
  buildSchema,
  modelOptions,
  plugin,
  prop,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

import { jsonToMongoose } from '../../json-schema';
import { duplicateKeyErrorPlugin, unsetPlugin } from '../../plugins';
import { namespaceValidator } from '../../validators';
import { CollectionDocument } from '../collection';
import { AuthorizationDocument } from '../authorization';

@modelOptions({ schemaOptions: { minimize: false, timestamps: true } })
@plugin(duplicateKeyErrorPlugin)
@plugin(unsetPlugin)
export class RecordSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({
    ref: 'CollectionSchema',
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    validate: namespaceValidator('collectionDocument', 'collectionId'),
  })
  public collectionId: mongoose.Types.ObjectId;

  public createdAt: Date;

  @prop({ ref: 'NamespaceSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public namespaceId: mongoose.Types.ObjectId;

  public properties: any;
  public updatedAt: Date;

  @prop({ ref: 'UserSchema', type: mongoose.Schema.Types.ObjectId })
  public userId: mongoose.Types.ObjectId;

  @prop({ foreignField: 'namespaceId', localField: 'namespaceId', ref: 'AuthorizationSchema' })
  public authorizationDocuments: AuthorizationDocument[];

  @prop({ foreignField: '_id', justOne: true, localField: 'collectionId', ref: 'CollectionSchema' })
  public collectionDocument: CollectionDocument;

  /**
   * Gets the Model defined by the Collection.
   */
  public static getModel(collection: CollectionDocument) {
    const { indexes, jsonSchema } = collection.toJSON();
    const schema = buildSchema(RecordSchema).clone();

    // Build schema from Collection's properties.
    schema.add({ properties: { _id: false, merge: true, type: jsonToMongoose(jsonSchema) } });
    schema.set('collection', collection.mongoName);

    // Register indexes with Mongoose.
    indexes.forEach((i) => schema.index(i.key, { ...i.options, name: `${i._id}` }));

    // Remove cached Model from Mongoose.
    try {
      collection.db.deleteModel(collection.mongoName);
    } catch {}

    return collection.db.model(collection.mongoName, schema) as RecordModel;
  }
}

export type RecordDocument = DocumentType<RecordSchema>;
export type RecordModel = ReturnModelType<typeof RecordSchema>;

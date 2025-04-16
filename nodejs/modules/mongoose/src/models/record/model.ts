import {
  buildSchema,
  DocumentType,
  modelOptions,
  plugin,
  prop,
  ReturnModelType,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

import { jsonToMongoose } from '../../json-schema';
import { duplicateKeyErrorPlugin, unsetPlugin } from '../../plugins';
import { CollectionDocument } from '../collection';
import { AuthorizationDocument } from '../authorization';

@modelOptions({ schemaOptions: { timestamps: true } })
@plugin(duplicateKeyErrorPlugin)
@plugin(unsetPlugin)
export class RecordSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ ref: 'CollectionSchema', required: true, type: mongoose.Schema.Types.ObjectId })
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

  /**
   * Gets the Model defined by the Collection.
   */
  public static getModel(collection: CollectionDocument) {
    const connection = collection.db;
    const { indexes, jsonSchema } = collection.toJSON();
    const schema = buildSchema(RecordSchema).clone();

    // Build schema from Collection's properties.
    schema.add({ properties: { merge: true, type: jsonToMongoose(jsonSchema, { _id: false }) } });
    schema.set('collection', collection.mongoName);

    // Register indexes with Mongoose.
    indexes.forEach((i) => {
      const key = i.keys.reduce((p, c) => ({ ...p, [c.field]: c.direction }), {});
      const options = Object.entries(i.options).reduce(
        (p, [k, v]) => (v === undefined ? p : { ...p, [k]: v }),
        {},
      );
      schema.index(key, { ...options, name: `${i._id}` });
    });

    // Remove cached Model from Mongoose.
    try {
      connection.deleteModel(collection.mongoName);
    } catch {}

    return connection.model(collection.mongoName, schema) as ReturnModelType<typeof RecordSchema>;
  }
}

export type RecordDocument = DocumentType<RecordSchema>;

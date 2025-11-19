import * as mongoose from 'mongoose';

import { JsonSchema, jsonToMongoose } from '../../json-schema';
import { duplicateKeyErrorPlugin, unsetPlugin } from '../../plugins';
import { AuthorizationDocument } from '../authorization';
import { CollectionDocument, CollectionIndex } from '../collection';

export interface Record<TProperties> {
  _id: mongoose.Types.ObjectId;
  authorizationDocuments?: AuthorizationDocument[];
  collectionId: mongoose.Types.ObjectId;
  createdAt?: Date;
  namespaceId: mongoose.Types.ObjectId;
  properties?: TProperties;
  updatedAt?: Date;
  userId?: mongoose.Types.ObjectId;
}

export type RecordDocument<TProperties = unknown> = mongoose.Document<mongoose.Types.ObjectId> &
  Record<TProperties>;

export type RecordModelType = mongoose.Model<RecordDocument>;

export const RecordSchema = new mongoose.Schema<RecordDocument, RecordModelType>(
  {
    collectionId: { ref: 'CollectionSchema', required: true, type: mongoose.Schema.Types.ObjectId },
    namespaceId: { ref: 'NamespaceSchema', required: true, type: mongoose.Schema.Types.ObjectId },
    properties: { type: mongoose.Schema.Types.Mixed },
    userId: { ref: 'UserSchema', type: mongoose.Schema.Types.ObjectId },
  },
  { timestamps: true },
);

RecordSchema.plugin(duplicateKeyErrorPlugin);
RecordSchema.plugin(unsetPlugin);

RecordSchema.virtual('authorizationDocuments', {
  foreignField: 'namespaceId',
  localField: 'namespaceId',
  ref: 'AuthorizationSchema',
});

export default RecordSchema;

export function getRecordModel(collection: CollectionDocument) {
  const json = collection.toJSON();
  const schema = RecordSchema.clone();

  const jsonSchema: JsonSchema = json.jsonSchema;
  const indexes: CollectionIndex[] = json.indexes;

  // Build schema from Collection's properties.
  schema.add({
    properties: {
      merge: true,
      type: jsonToMongoose(jsonSchema, { _id: false }),
    },
  });
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
    collection.db.deleteModel(collection.mongoName);
  } catch {}

  return collection.db.model<RecordDocument, RecordModelType>(collection.mongoName, schema);
}

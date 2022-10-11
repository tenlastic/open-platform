import {
  changeStreamPlugin,
  errors,
  EventEmitter,
  IDatabasePayload,
  namespaceValidator,
  jsonToMongoose,
} from '@tenlastic/mongoose-models';
import {
  DocumentType,
  ReturnModelType,
  buildSchema,
  modelOptions,
  plugin,
  prop,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

import { CollectionDocument } from '../collection';
import { AuthorizationDocument } from '../authorization';

export const OnRecordProduced = new EventEmitter<IDatabasePayload<RecordDocument>>();

@modelOptions({ schemaOptions: { minimize: false, timestamps: true } })
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: OnRecordProduced })
@plugin(errors.unique.plugin)
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

  public static getModel(collection: CollectionDocument) {
    // Build schema from Collection's properties.
    const schema = buildSchema(RecordSchema).clone();
    schema.add({ properties: jsonToMongoose(collection.jsonSchema) });
    schema.set('collection', collection.mongoName);

    // Register indexes with Mongoose.
    collection.indexes.forEach((i) => {
      schema.index(i.key as any, { ...i.options, name: i._id.toHexString() });
    });

    // Remove cached Model from Mongoose.
    try {
      mongoose.connection.deleteModel(collection.mongoName);
    } catch {}

    const model = mongoose.model(collection.mongoName, schema) as unknown;
    return model as RecordModel;
  }
}

export type RecordDocument = DocumentType<RecordSchema>;
export type RecordModel = ReturnModelType<typeof RecordSchema>;

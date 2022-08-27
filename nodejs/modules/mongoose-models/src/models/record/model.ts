import {
  DocumentType,
  ReturnModelType,
  buildSchema,
  modelOptions,
  plugin,
  prop,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

import { changeStreamPlugin, EventEmitter, IDatabasePayload } from '../../change-stream';
import * as errors from '../../errors';
import { namespaceValidator } from '../../validators';
import { toMongoose } from '../../json-schema';
import { CollectionDocument } from '../collection';
import { NamespaceDocument } from '../namespace';
import { UserDocument } from '../user';
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
    validate: namespaceValidator('collectionDocument', 'collectionId'),
  })
  public collectionId: mongoose.Types.ObjectId;

  public createdAt: Date;

  @prop({ ref: 'NamespaceSchema', required: true })
  public namespaceId: mongoose.Types.ObjectId;

  public properties: any;
  public updatedAt: Date;

  @prop({ ref: 'UserSchema' })
  public userId: mongoose.Types.ObjectId;

  @prop({ foreignField: 'namespaceId', localField: 'namespaceId', ref: 'AuthorizationSchema' })
  public authorizationDocuments: AuthorizationDocument[];

  @prop({ foreignField: '_id', justOne: true, localField: 'collectionId', ref: 'CollectionSchema' })
  public collectionDocument: CollectionDocument;

  @prop({ foreignField: '_id', justOne: true, localField: 'namespaceId', ref: 'NamespaceSchema' })
  public namespaceDocument: NamespaceDocument;

  @prop({ foreignField: '_id', justOne: true, localField: 'userId', ref: 'UserSchema' })
  public userDocument: UserDocument;

  public static getModel(collection: CollectionDocument) {
    // Build schema from Collection's properties.
    const schema = buildSchema(RecordSchema).clone();
    schema.add({ properties: toMongoose(collection.jsonSchema) });
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

import {
  DocumentType,
  Ref,
  ReturnModelType,
  arrayProp,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  post,
  pre,
  prop,
} from '@typegoose/typegoose';
import * as jsonSchema from '@tenlastic/json-schema';
import {
  EventEmitter,
  IDatabasePayload,
  IOriginalDocument,
  changeStreamPlugin,
} from '@tenlastic/mongoose-change-stream';
import { IOptions } from '@tenlastic/mongoose-permissions';
import { plugin as uniqueErrorPlugin } from '@tenlastic/mongoose-unique-error';
import * as mongoose from 'mongoose';

import { jsonSchemaPropertiesValidator, namespaceValidator } from '../../validators';
import { DatabaseDocument, DatabaseEvent } from '../database';
import { NamespaceDocument } from '../namespace';
import { RecordSchema } from '../record';
import { CollectionIndexSchema } from './index/index';

export const CollectionEvent = new EventEmitter<IDatabasePayload<CollectionDocument>>();

// Delete Collections if associated Database is deleted.
DatabaseEvent.sync(async payload => {
  switch (payload.operationType) {
    case 'delete':
      const records = await Collection.find({ databaseId: payload.fullDocument._id });
      const promises = records.map(r => r.remove());
      return Promise.all(promises);
  }
});

@index({ namespaceId: 1, name: 1 }, { unique: true })
@modelOptions({
  schemaOptions: {
    collection: 'collections',
    minimize: false,
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  },
})
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: CollectionEvent })
@plugin(uniqueErrorPlugin)
@pre('save', async function(this: CollectionDocument) {
  const Record = RecordSchema.getModel(this);
  await Record.syncIndexes({ background: true });
})
@post('remove', async function(this: CollectionDocument) {
  try {
    await this.dropCollection();
  } catch {}
})
@post('save', async function(this: CollectionDocument) {
  await this.setValidator();
})
export class CollectionSchema implements IOriginalDocument {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({
    immutable: true,
    ref: 'NamespaceSchema',
    required: true,
    validate: namespaceValidator('databaseDocument', 'databaseId'),
  })
  public databaseId: Ref<DatabaseDocument>;

  @arrayProp({ items: CollectionIndexSchema })
  public indexes: CollectionIndexSchema[];

  @prop({
    _id: false,
    default: JSON.stringify({ type: 'object' }),
    get: value => (typeof value === 'string' ? JSON.parse(value) : value),
    set: value => (typeof value === 'string' ? value : JSON.stringify(value)),
    validate: jsonSchemaPropertiesValidator,
  })
  public jsonSchema: any;

  @prop({ required: 'true' })
  public name: string;

  @prop({ immutable: true, ref: 'NamespaceSchema', required: true })
  public namespaceId: Ref<NamespaceDocument>;

  @prop({
    _id: false,
    default: JSON.stringify({}),
    get: value => (typeof value === 'string' ? JSON.parse(value) : value),
    set: value => (typeof value === 'string' ? value : JSON.stringify(value)),
  })
  public permissions: IOptions;

  public updatedAt: Date;

  @prop({ foreignField: '_id', justOne: true, localField: 'databaseId', ref: 'DatabaseSchema' })
  public databaseDocument: DatabaseDocument;

  @prop({ foreignField: '_id', justOne: true, localField: 'namespaceId', ref: 'NamespaceSchema' })
  public namespaceDocument: NamespaceDocument;

  public _original: CollectionDocument;
  public get mongoName() {
    return `collections.${this._id}`;
  }
  public wasModified: string[];
  public wasNew: boolean;

  /**
   * Drops collection from MongoDB.
   */
  public async dropCollection(this: CollectionDocument) {
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionExists = collections.map(c => c.name).includes(this.mongoName);

    if (!collectionExists) {
      return;
    }

    return mongoose.connection.db.dropCollection(this.mongoName);
  }

  /**
   * Sets the validator on the MongoDB collection.
   * Creates the collection first if it does not exist.
   */
  public async setValidator(this: CollectionDocument) {
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionExists = collections.map(c => c.name).includes(this.mongoName);

    if (collectionExists) {
      await mongoose.connection.db.command({
        collMod: this.mongoName,
        validator: this.getValidator(),
      });
    } else {
      await mongoose.connection.createCollection(this.mongoName, {
        strict: true,
        validationLevel: 'strict',
        validator: this.getValidator(),
      });
    }
  }

  /**
   * Gets the MongoDB validator schema.
   */
  private getValidator() {
    return {
      $jsonSchema: {
        additionalProperties: false,
        bsonType: 'object',
        properties: {
          __v: {
            bsonType: 'number',
          },
          _id: {
            bsonType: 'objectId',
          },
          collectionId: {
            bsonType: 'objectId',
          },
          createdAt: {
            bsonType: 'date',
          },
          databaseId: {
            bsonType: 'objectId',
          },
          namespaceId: {
            bsonType: 'objectId',
          },
          properties: jsonSchema.toMongo(this.jsonSchema),
          updatedAt: {
            bsonType: 'date',
          },
          userId: {
            bsonType: 'objectId',
          },
        },
      },
    };
  }
}

export type CollectionDocument = DocumentType<CollectionSchema>;
export type CollectionModel = ReturnModelType<typeof CollectionSchema>;
export const Collection = getModelForClass(CollectionSchema);

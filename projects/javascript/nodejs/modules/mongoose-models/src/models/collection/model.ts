import {
  DocumentType,
  Ref,
  ReturnModelType,
  arrayProp,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  pre,
  prop,
} from '@hasezoey/typegoose';
import * as jsonSchema from '@tenlastic/json-schema';
import {
  EventEmitter,
  IDatabasePayload,
  changeStreamPlugin,
} from '@tenlastic/mongoose-change-stream';
import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import { IOptions } from '@tenlastic/mongoose-permissions';
import { jsonSchemaPropertiesValidator } from '@tenlastic/validations';
import { plugin as uniqueErrorPlugin } from '@tenlastic/mongoose-unique-error';
import * as mongoose from 'mongoose';

import { IndexSchema } from './index/model';
import { NamespaceDocument, NamespaceEvent } from '../namespace/model';

export const CollectionEvent = new EventEmitter<IDatabasePayload<CollectionDocument>>();

// Publish changes to Kafka.
CollectionEvent.on(payload => {
  kafka.publish(payload);
});

// Drop MongoDB collection on delete.
CollectionEvent.on(async payload => {
  const collection = new Collection(payload.fullDocument);

  switch (payload.operationType) {
    case 'delete':
      return collection.dropCollection();

    case 'insert':
    case 'update':
      return collection.setValidator();
  }
});

// Delete Collections if associated Namespace is deleted.
NamespaceEvent.on(async payload => {
  switch (payload.operationType) {
    case 'delete':
      const records = await Collection.find({ namespaceId: payload.fullDocument._id });
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
export class CollectionSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @arrayProp({ items: IndexSchema })
  public indexes: IndexSchema[];

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

  @prop({ ref: 'NamespaceSchema', required: true })
  public namespaceId: Ref<NamespaceDocument>;

  @prop({
    _id: false,
    default: JSON.stringify({}),
    get: value => (typeof value === 'string' ? JSON.parse(value) : value),
    set: value => (typeof value === 'string' ? value : JSON.stringify(value)),
  })
  public permissions: IOptions;

  public updatedAt: Date;

  @prop({ foreignField: '_id', justOne: true, localField: 'namespaceId', ref: 'NamespaceSchema' })
  public namespaceDocument: NamespaceDocument;

  public get collectionName() {
    return `collections/${this._id}`;
  }

  private get validator() {
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

  /**
   * Drops collection from MongoDB.
   */
  public async dropCollection(this: CollectionDocument) {
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionExists = collections.map(c => c.name).includes(this.collectionName);

    if (!collectionExists) {
      return;
    }

    return mongoose.connection.db.dropCollection(this.collectionName);
  }

  /**
   * Sets the validator on the MongoDB collection.
   * Creates the collection first if it does not exist.
   */
  public async setValidator(this: CollectionDocument) {
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionExists = collections.map(c => c.name).includes(this.collectionName);

    if (collectionExists) {
      await mongoose.connection.db.command({
        collMod: this.collectionName,
        validator: this.validator,
      });
    } else {
      await mongoose.connection.createCollection(this.collectionName, {
        strict: true,
        validationLevel: 'strict',
        validator: this.validator,
      });
    }
  }
}

export type CollectionDocument = DocumentType<CollectionSchema>;
export type CollectionModel = ReturnModelType<typeof CollectionSchema>;
export const Collection = getModelForClass(CollectionSchema);

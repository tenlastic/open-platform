import {
  changeStreamPlugin,
  errors,
  EventEmitter,
  IDatabasePayload,
  IOriginalDocument,
  jsonSchemaPropertiesValidator,
  jsonToMongo,
} from '@tenlastic/mongoose-models';
import {
  DocumentType,
  ReturnModelType,
  Severity,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  post,
  pre,
  prop,
} from '@typegoose/typegoose';
import { IOptions } from '@tenlastic/mongoose-permissions';
import * as mongoose from 'mongoose';

import { RecordSchema } from '../record';
import { CollectionIndexSchema } from './index/index';
import { AuthorizationDocument } from '../authorization';

export const OnCollectionProduced = new EventEmitter<IDatabasePayload<CollectionDocument>>();

@index({ name: 1, namespaceId: 1 }, { unique: true })
@modelOptions({
  options: { allowMixed: Severity.ALLOW },
  schemaOptions: {
    collection: 'collections',
    minimize: false,
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  },
})
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: OnCollectionProduced })
@plugin(errors.unique.plugin)
@pre('save', async function (this: CollectionDocument) {
  const Record = RecordSchema.getModel(this);
  await Record.syncIndexes({ background: true });
})
@post('remove', async function (this: CollectionDocument) {
  try {
    await this.dropCollection();
  } catch {}
})
@post('save', async function (this: CollectionDocument) {
  await this.setValidator();
})
export class CollectionSchema implements IOriginalDocument {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ type: CollectionIndexSchema })
  public indexes: CollectionIndexSchema[];

  @prop({
    _id: false,
    default: JSON.stringify({ type: 'object' }),
    get: (value) => (typeof value === 'string' ? JSON.parse(value) : value),
    set: (value) => (typeof value === 'string' ? value : JSON.stringify(value)),
    validate: jsonSchemaPropertiesValidator,
  })
  public jsonSchema: any;

  @prop({ required: true })
  public name: string;

  @prop({ immutable: true, ref: 'NamespaceSchema', required: true })
  public namespaceId: mongoose.Types.ObjectId;

  @prop({
    _id: false,
    default: JSON.stringify({}),
    get: (value) => (typeof value === 'string' ? JSON.parse(value) : value),
    set: (value) => (typeof value === 'string' ? value : JSON.stringify(value)),
  })
  public permissions: IOptions;

  public updatedAt: Date;

  @prop({ foreignField: 'namespaceId', localField: 'namespaceId', ref: 'AuthorizationSchema' })
  public authorizationDocuments: AuthorizationDocument[];

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
    const collectionExists = collections.map((c) => c.name).includes(this.mongoName);

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
    const collectionExists = collections.map((c) => c.name).includes(this.mongoName);

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
          namespaceId: {
            bsonType: 'objectId',
          },
          properties: jsonToMongo(this.jsonSchema),
          updatedAt: {
            bsonType: 'date',
          },
          userId: {
            bsonType: ['null', 'objectId', 'undefined'],
          },
        },
      },
    };
  }
}

export type CollectionDocument = DocumentType<CollectionSchema>;
export type CollectionModel = ReturnModelType<typeof CollectionSchema>;
export const Collection = getModelForClass(CollectionSchema);

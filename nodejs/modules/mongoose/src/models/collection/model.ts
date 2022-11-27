import {
  DocumentType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  post,
  pre,
  prop,
  PropType,
  ReturnModelType,
  Severity,
} from '@typegoose/typegoose';
import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { jsonToMongo } from '../../json-schema';
import { duplicateKeyErrorPlugin } from '../../plugins';
import { syncIndexes } from '../../sync-indexes';
import { jsonSchemaPropertiesValidator } from '../../validators';
import { AuthorizationDocument } from '../authorization';
import { RecordSchema } from '../record';
import { SchemaSchema } from '../schema';
import { CollectionIndexSchema } from './index/index';
import { CollectionModelPermissions, CollectionModelPermissionsSchema } from './permissions';

@index({ name: 1, namespaceId: 1 }, { unique: true })
@modelOptions({
  options: { allowMixed: Severity.ALLOW, enableMergeHooks: true },
  schemaOptions: {
    collection: 'collections',
    minimize: false,
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  },
})
@plugin(duplicateKeyErrorPlugin)
@pre('save', async function (this: CollectionDocument) {
  const Record = RecordSchema.getModel(this);
  await syncIndexes(Record);

  const Schema = getModelForClass(SchemaSchema);
  await Schema.sync(Record);
})
@post('remove', async function (this: CollectionDocument) {
  try {
    await this.dropCollection();

    const Schema = getModelForClass(SchemaSchema);
    await Schema.deleteOne({ name: this.collection.name });
  } catch (e) {
    console.error(e.message);
  }
})
@post('save', async function (this: CollectionDocument) {
  await this.setValidator();
})
export class CollectionSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ type: CollectionIndexSchema }, PropType.ARRAY)
  public indexes: CollectionIndexSchema[];

  @prop(
    {
      _id: false,
      default: JSON.stringify({ type: 'object' }),
      get: (value) => (typeof value === 'string' ? JSON.parse(value) : value),
      set: (value) => (typeof value === 'string' ? value : JSON.stringify(value)),
      type: mongoose.Schema.Types.Mixed,
      validate: jsonSchemaPropertiesValidator,
    },
    PropType.NONE,
  )
  public jsonSchema: any;

  @prop({ required: true, type: String })
  public name: string;

  @prop({ ref: 'NamespaceSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public namespaceId: mongoose.Types.ObjectId;

  @prop({ default: new CollectionModelPermissions(), type: CollectionModelPermissionsSchema })
  public permissions: CollectionModelPermissionsSchema;

  public updatedAt: Date;

  @prop({ foreignField: 'namespaceId', localField: 'namespaceId', ref: 'AuthorizationSchema' })
  public authorizationDocuments: AuthorizationDocument[];

  public get mongoName() {
    return `collections.${this._id}`;
  }

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(this: CollectionModel, values: Partial<CollectionSchema> = {}) {
    const chance = new Chance();
    const defaults = { name: chance.hash(), namespaceId: new mongoose.Types.ObjectId() };

    return new this({ ...defaults, ...values });
  }

  /**
   * Drops the collection from MongoDB.
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
          __v: { bsonType: 'number' },
          _id: { bsonType: 'objectId' },
          collectionId: { bsonType: 'objectId' },
          createdAt: { bsonType: 'date' },
          namespaceId: { bsonType: 'objectId' },
          properties: jsonToMongo(this.jsonSchema),
          updatedAt: { bsonType: 'date' },
          userId: { bsonType: ['null', 'objectId', 'undefined'] },
        },
      },
    };
  }
}

export type CollectionDocument = DocumentType<CollectionSchema>;
export type CollectionModel = ReturnModelType<typeof CollectionSchema>;
export const Collection = getModelForClass(CollectionSchema);

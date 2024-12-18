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
  Severity,
} from '@typegoose/typegoose';
import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { enablePrePostImages } from '../../enable-pre-post-images';
import { jsonToMongo } from '../../json-schema';
import { duplicateKeyErrorPlugin, minimizePlugin, setPlugin, unsetPlugin } from '../../plugins';
import { jsonSchemaValidator } from '../../validators';
import { AuthorizationDocument } from '../authorization';
import { RecordSchema } from '../record';
import { SchemaSchema } from '../schema';
import { CollectionIndexDocument, CollectionIndexSchema } from './index/index';
import {
  CollectionPermissionsDocument,
  CollectionPermissionsModel,
  CollectionPermissionsSchema,
} from './permissions';

export interface CollectionJsonSchema {
  properties: { [s: string]: CollectionJsonSchemaProperties };
  required?: string[];
  type: 'object';
}

export interface CollectionJsonSchemaProperties {
  default?: boolean | number | string;
  format?: 'date-time';
  items?: CollectionJsonSchemaProperties;
  properties?: { [s: string]: CollectionJsonSchemaProperties };
  type: CollectionJsonSchemaType;
}

export enum CollectionJsonSchemaType {
  Array = 'array',
  Boolean = 'boolean',
  Integer = 'integer',
  Null = 'null',
  Number = 'number',
  Object = 'object',
  String = 'string',
}

@index({ name: 1, namespaceId: 1 }, { unique: true })
@modelOptions({
  options: { allowMixed: Severity.ALLOW },
  schemaOptions: { collection: 'collections', timestamps: true },
})
@plugin(duplicateKeyErrorPlugin)
@plugin(minimizePlugin)
@plugin(setPlugin)
@plugin(unsetPlugin)
@pre('save', async function (this: CollectionDocument) {
  const Model = RecordSchema.getModel(this);
  await Model.syncIndexes();

  const SchemaModel = getModelForClass(SchemaSchema);
  await SchemaModel.sync(Model);

  await enablePrePostImages(Model);
})
@post('remove', async function (this: CollectionDocument) {
  try {
    await this.dropCollection();

    const Schema = getModelForClass(SchemaSchema);
    await Schema.deleteOne({ name: this.collection.name });
  } catch (e) {
    console.error(e);
  }
})
@post('save', async function (this: CollectionDocument) {
  await this.setValidator();
})
export class CollectionSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ type: CollectionIndexSchema }, PropType.ARRAY)
  public indexes: CollectionIndexDocument[];

  @prop({ required: true, type: mongoose.Schema.Types.Mixed, validate: jsonSchemaValidator as any })
  public jsonSchema: CollectionJsonSchema;

  @prop({ maxlength: 64, required: true, trim: true, type: String })
  public name: string;

  @prop({ ref: 'NamespaceSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public namespaceId: mongoose.Types.ObjectId;

  @prop({ required: true, type: CollectionPermissionsSchema })
  public permissions: CollectionPermissionsDocument;

  public updatedAt: Date;

  @prop({ foreignField: 'namespaceId', localField: 'namespaceId', ref: 'AuthorizationSchema' })
  public authorizationDocuments: AuthorizationDocument[];

  public get mongoName() {
    return `collections.${this._id}`;
  }

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(this: typeof CollectionModel, values: Partial<CollectionSchema> = {}) {
    const chance = new Chance();
    const defaults = {
      jsonSchema: {
        properties: { key: { type: 'string' } },
        type: 'object',
      },
      name: chance.hash(),
      namespaceId: new mongoose.Types.ObjectId(),
      permissions: CollectionPermissionsModel.mock(),
    };

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
  private getValidator(this: CollectionDocument) {
    const { jsonSchema } = this.toJSON();

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
          properties: jsonToMongo(jsonSchema),
          updatedAt: { bsonType: 'date' },
          userId: { bsonType: ['null', 'objectId', 'undefined'] },
        },
      },
    };
  }
}

export type CollectionDocument = DocumentType<CollectionSchema>;
export const CollectionModel = getModelForClass(CollectionSchema);

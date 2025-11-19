import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { enablePrePostImages } from '../../enable-pre-post-images';
import { JsonSchema, JsonSchemaType, jsonToMongo } from '../../json-schema';
import { duplicateKeyErrorPlugin, minimizePlugin, setPlugin, unsetPlugin } from '../../plugins';
import { jsonSchemaValidator } from '../../validators';
import { AuthorizationDocument } from '../authorization';
import { getRecordModel } from '../record';
import { getSchemaModel } from '../schema';
import { CollectionIndexDocument, CollectionIndexSchema } from './index';
import {
  CollectionPermissionsDocument,
  CollectionPermissionsModel,
  CollectionPermissionsSchema,
} from './permissions';

export interface Collection {
  _id: mongoose.Types.ObjectId;
  authorizationDocuments?: AuthorizationDocument[];
  createdAt?: Date;
  indexes?: CollectionIndexDocument[];
  jsonSchema: JsonSchema;
  mongoName: string;
  name: string;
  namespaceId: mongoose.Types.ObjectId;
  permissions: CollectionPermissionsDocument;
  updatedAt?: Date;
}

export type CollectionDocument = mongoose.Document<mongoose.Types.ObjectId> &
  Collection & {
    /**
     * Drops the collection from MongoDB.
     */
    dropCollection(): Promise<unknown> | void;
    /**
     * Gets the MongoDB validator schema.
     */
    getValidator(): unknown;
    /**
     * Sets the validator on the MongoDB collection.
     * Creates the collection first if it does not exist.
     */
    setValidator(): Promise<unknown>;
  };

export interface CollectionModelType extends mongoose.Model<CollectionDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(this: CollectionModelType, values?: Partial<Collection>): CollectionDocument;
}

const CollectionSchema = new mongoose.Schema<CollectionDocument, CollectionModelType>(
  {
    indexes: { type: [CollectionIndexSchema] },
    jsonSchema: {
      required: true,
      type: mongoose.Schema.Types.Mixed,
      validate: jsonSchemaValidator,
    },
    name: { maxlength: 64, required: true, trim: true, type: String },
    namespaceId: { ref: 'NamespaceSchema', required: true, type: mongoose.Schema.Types.ObjectId },
    permissions: { required: true, type: CollectionPermissionsSchema },
  },
  {
    collection: 'collections',
    timestamps: true,
  },
);

CollectionSchema.index({ name: 1, namespaceId: 1 }, { unique: true });

CollectionSchema.plugin(duplicateKeyErrorPlugin);
CollectionSchema.plugin(minimizePlugin);
CollectionSchema.plugin(setPlugin);
CollectionSchema.plugin(unsetPlugin);

CollectionSchema.pre('save', async function (this: CollectionDocument) {
  const Model = getRecordModel(this);
  await Model.syncIndexes();

  const SchemaModel = getSchemaModel();
  await SchemaModel.sync(Model);

  await enablePrePostImages(Model);
});

CollectionSchema.post('deleteOne', async function (this: CollectionDocument) {
  try {
    await this.dropCollection();

    const SchemaModel = getSchemaModel();
    await SchemaModel.deleteOne({ name: this.collection.name });
  } catch (e) {
    console.error(e);
  }
});

CollectionSchema.post('save', async function (this: CollectionDocument) {
  await this.setValidator();
});

CollectionSchema.virtual('authorizationDocuments', {
  foreignField: 'namespaceId',
  justOne: false,
  localField: 'namespaceId',
  ref: 'AuthorizationSchema',
});

CollectionSchema.virtual('mongoName').get(function (this: CollectionDocument) {
  return `collections.${this._id}`;
});

CollectionSchema.statics.mock = function (values: Partial<Collection> = {}) {
  const chance = new Chance();
  const defaults: Partial<Collection> = {
    jsonSchema: {
      properties: { key: { type: JsonSchemaType.String } },
      type: JsonSchemaType.Object,
    },
    name: chance.hash(),
    namespaceId: new mongoose.Types.ObjectId(),
    permissions: CollectionPermissionsModel.mock(),
  };

  return new this({ ...defaults, ...values });
};

CollectionSchema.methods.dropCollection = async function (this: CollectionDocument) {
  const collections = await mongoose.connection.db.listCollections().toArray();
  const collectionExists = collections.map((c) => c.name).includes(this.mongoName);

  if (!collectionExists) {
    return;
  }

  return mongoose.connection.db.dropCollection(this.mongoName);
};

CollectionSchema.methods.setValidator = async function (this: CollectionDocument) {
  const collections = await mongoose.connection.db.listCollections().toArray();
  const collectionExists = collections.map((c) => c.name).includes(this.mongoName);

  if (collectionExists) {
    await mongoose.connection.db.command({
      collMod: this.mongoName,
      validator: this.getValidator(),
    });
  } else {
    await mongoose.connection.createCollection(this.mongoName, {
      validationLevel: 'strict',
      validator: this.getValidator(),
    });
  }
};

CollectionSchema.methods.getValidator = function (this: CollectionDocument) {
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
        properties: jsonToMongo(jsonSchema as JsonSchema),
        updatedAt: { bsonType: 'date' },
        userId: { bsonType: ['null', 'objectId', 'undefined'] },
      },
    },
  };
};

export const CollectionModel = mongoose.model<CollectionDocument, CollectionModelType>(
  'CollectionSchema',
  CollectionSchema,
  'collections',
);

export default CollectionModel;

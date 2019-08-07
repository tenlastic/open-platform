import * as mongoose from 'mongoose';
import {
  InstanceType,
  ModelType,
  Ref,
  Typegoose,
  arrayProp,
  index,
  instanceMethod,
  pre,
  prop,
} from 'typegoose';

import { DatabaseDocument, DatabaseSchema } from '../database/model';

export interface IndexKey {
  [s: string]: number;
}

export interface IndexOptions {
  background?: boolean;
  expireAfterSeconds?: number;
  name?: string;
  partialFilterExpression?: any;
  unique?: boolean;
}

class Index {
  public _id?: mongoose.Types.ObjectId;

  @prop({ required: true })
  public key: IndexKey;

  @prop({ default: {} })
  public options?: IndexOptions;
}

@index({ databaseId: 1, name: 1 }, { unique: true })
@pre('save', async function(this: CollectionDocument) {
  await this.createCollection();
})
export class CollectionSchema extends Typegoose {
  public static readonly CREATE_INDEX_QUEUE = 'create-collection-index';
  public static readonly DELETE_INDEX_QUEUE = 'delete-collection-index';

  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ ref: 'DatabaseSchema', required: true })
  public databaseId: Ref<DatabaseSchema>;

  @arrayProp({ items: Index })
  public indexes: Index[];

  @prop({ _id: false, default: { type: 'object' }, required: true })
  public jsonSchema: any;

  @prop({ required: 'true' })
  public name: string;

  public updatedAt: Date;

  @prop({
    foreignField: '_id',
    justOne: true,
    localField: 'databaseId',
    overwrite: true,
    ref: 'DatabaseSchema',
  })
  public get databaseDocument(): DatabaseDocument {
    return this.databaseDocument;
  }

  /**
   * Creates the collection if it does not already exist.
   */
  @instanceMethod
  public async createCollection(this: CollectionDocument) {
    const collections = await mongoose.connection.db.listCollections().toArray();
    if (!collections.map(c => c.name).includes(this.id)) {
      await mongoose.connection.createCollection(this.id, { strict: true });
    }
  }

  /**
   * Sets the validator within MongoDB to a proper JSON Schema object.
   */
  @instanceMethod
  public async setValidator(this: CollectionDocument) {
    return mongoose.connection.db.command({
      collMod: this.id,
      validator: {
        $jsonSchema: {
          additionalProperties: false,
          bsonType: 'object',
          properties: {
            _id: {
              bsonType: 'objectId',
            },
            __v: {
              bsonType: 'number',
            },
            collectionId: {
              bsonType: 'objectId',
            },
            createdAt: {
              bsonType: 'date',
            },
            customProperties: this.jsonSchema,
            databaseId: {
              bsonType: 'objectId',
            },
            updatedAt: {
              bsonType: 'date',
            },
          },
          required: [
            '_id',
            '__v',
            'collectionId',
            'createdAt',
            'customProperties',
            'databaseId',
            'updatedAt',
          ],
        },
      },
      validationLevel: 'strict',
    });
  }
}

export type CollectionDocument = InstanceType<CollectionSchema>;
export type CollectionModel = ModelType<CollectionSchema>;
export const Collection = new CollectionSchema().getModelForClass(CollectionSchema, {
  schemaOptions: {
    autoIndex: false,
    collection: 'collections',
    timestamps: true,
  },
});

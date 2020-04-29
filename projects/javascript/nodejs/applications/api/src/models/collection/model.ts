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
import { IOptions } from '@tenlastic/mongoose-permissions';
import { jsonSchemaPropertiesValidator } from '@tenlastic/validations';
import { plugin as uniqueErrorPlugin } from '@tenlastic/mongoose-unique-error';
import * as mongoose from 'mongoose';

import { Database, DatabaseDocument, DatabaseSchema } from '../database/model';
import { IndexSchema } from './index/model';

@index({ databaseId: 1, name: 1 }, { unique: true })
@modelOptions({
  schemaOptions: {
    autoIndex: true,
    collection: 'collections',
    minimize: false,
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  },
})
@plugin(uniqueErrorPlugin)
@pre('save', async function(this: CollectionDocument) {
  await this.setValidator();
})
export class CollectionSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ ref: Database, required: true })
  public databaseId: Ref<DatabaseSchema>;

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

  @prop({ match: /^[0-9a-z\-]{2,40}$/, required: 'true' })
  public name: string;

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

  public getValidator(this: CollectionDocument) {
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
   * Creates the collection if it does not already exist.
   */
  public async setValidator(this: CollectionDocument) {
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionExists = collections.map(c => c.name).includes(this.id);

    if (collectionExists) {
      await mongoose.connection.db.command({
        collMod: this.id,
        validator: this.getValidator(),
      });
    } else {
      await mongoose.connection.createCollection(this.id, {
        strict: true,
        validationLevel: 'strict',
        validator: this.getValidator(),
      });
    }
  }
}

export type CollectionDocument = DocumentType<CollectionSchema>;
export type CollectionModel = ReturnModelType<typeof CollectionSchema>;
export const Collection = getModelForClass(CollectionSchema);

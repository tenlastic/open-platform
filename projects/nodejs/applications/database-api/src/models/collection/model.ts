import * as jsonSchema from '@tenlastic/json-schema';
import { IOptions } from '@tenlastic/mongoose-permissions';
import { plugin as uniqueErrorPlugin } from '@tenlastic/mongoose-unique-error';
import * as mongoose from 'mongoose';
import {
  InstanceType,
  ModelType,
  Ref,
  Typegoose,
  arrayProp,
  index,
  instanceMethod,
  plugin,
  pre,
  prop,
} from 'typegoose';

import { Database, DatabaseDocument, DatabaseSchema } from '../database/model';
import { IndexSchema } from './index/model';

@index({ databaseId: 1, name: 1 }, { unique: true })
@plugin(uniqueErrorPlugin)
@pre('save', async function(this: CollectionDocument) {
  await this.setValidator();
})
export class CollectionSchema extends Typegoose {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ ref: Database, required: true })
  public databaseId: Ref<DatabaseSchema>;

  @arrayProp({ items: IndexSchema })
  public indexes: IndexSchema[];

  @prop({ _id: false, default: { type: 'object' } })
  public jsonSchema: any;

  @prop({ match: /^[0-9a-z\-]{6,40}$/, required: 'true' })
  public name: string;

  @prop({ _id: false, default: {} })
  public permissions: IOptions;

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

  @prop()
  public get validator() {
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
          customProperties: jsonSchema.toMongo(this.jsonSchema),
          databaseId: {
            bsonType: 'objectId',
          },
          updatedAt: {
            bsonType: 'date',
          },
        },
        required: ['_id', '__v', 'collectionId', 'createdAt', 'databaseId', 'updatedAt'],
      },
    };
  }

  /**
   * Creates the collection if it does not already exist.
   */
  @instanceMethod
  public async setValidator(this: CollectionDocument) {
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionExists = collections.map(c => c.name).includes(this.id);

    if (collectionExists) {
      await mongoose.connection.db.command({
        collMod: this.id,
        validator: this.validator,
      });
    } else {
      await mongoose.connection.createCollection(this.id, {
        strict: true,
        validationLevel: 'strict',
        validator: this.validator,
      });
    }
  }
}

export type CollectionDocument = InstanceType<CollectionSchema>;
export type CollectionModel = ModelType<CollectionSchema>;
export const Collection = new CollectionSchema().getModelForClass(CollectionSchema, {
  schemaOptions: {
    autoIndex: false,
    collection: 'collections',
    minimize: false,
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
});

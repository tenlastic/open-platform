import { DocumentType, Ref, ReturnModelType, buildSchema, prop } from '@hasezoey/typegoose';
import * as jsonSchema from '@tenlastic/json-schema';
import {
  EventEmitter,
  IDatabasePayload,
  changeStreamPlugin,
} from '@tenlastic/mongoose-change-stream';
import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import { IOptions, MongoosePermissions } from '@tenlastic/mongoose-permissions';
import { plugin as uniqueErrorPlugin } from '@tenlastic/mongoose-unique-error';
import * as mongoose from 'mongoose';

import { CollectionDocument } from '../collection/model';
import { UserDocument } from '../user/model';
import { RecordPermissions } from './permissions';

export class RecordSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ ref: 'CollectionSchema', required: true })
  public collectionId: Ref<CollectionDocument>;

  public createdAt: Date;
  public properties: any;

  public updatedAt: Date;

  @prop({ ref: 'UserSchema' })
  public userId: Ref<UserDocument>;

  @prop({ foreignField: '_id', justOne: true, localField: 'collectionId', ref: 'CollectionSchema' })
  public collectionDocument: CollectionDocument;

  @prop({ foreignField: '_id', justOne: true, localField: 'userId', ref: 'UserSchema' })
  public userDocument: UserDocument;

  public static getModel(collection: CollectionDocument) {
    // Build schema from Collection's properties.
    const Schema = buildSchema(RecordSchema);
    const schema = new mongoose.Schema(
      { properties: jsonSchema.toMongoose(collection.jsonSchema) },
      {
        autoIndex: false,
        collection: collection.collectionName,
        minimize: false,
        timestamps: true,
      },
    );
    schema.add(Schema);

    // Register indexes with Mongoose.
    collection.indexes.forEach(i => schema.index(i.key, i.options));

    // Send changes to Kafka.
    const RecordEvent = new EventEmitter<IDatabasePayload<RecordDocument>>();
    RecordEvent.on(payload => {
      kafka.publish(payload);
    });
    schema.plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: RecordEvent });

    // Handle uniqueness errors uniformly.
    schema.plugin(uniqueErrorPlugin);

    // Remove cached Model from Mongoose.
    try {
      mongoose.connection.deleteModel(collection.collectionName);
    } catch {}

    return mongoose.model(collection.collectionName, schema) as mongoose.Model<RecordDocument, {}> &
      RecordSchema &
      typeof RecordSchema;
  }

  public static getPermissions(Model: RecordModel, collection: CollectionDocument) {
    const permissions = Object.assign({}, RecordPermissions) as IOptions;

    if (collection.permissions.create) {
      permissions.create.base = collection.permissions.create.base;
      Object.assign(permissions.create.roles, collection.permissions.create.roles);
    }
    if (collection.permissions.delete) {
      permissions.delete.base = collection.permissions.delete.base;
      Object.assign(permissions.delete.roles, collection.permissions.delete.roles);
    }
    if (collection.permissions.find) {
      permissions.find.base = { $or: [permissions.find.base, collection.permissions.find.base] };
      Object.assign(permissions.find.roles, collection.permissions.find.roles);
    }
    if (collection.permissions.populate) {
      permissions.populate.push(...collection.permissions.populate);
    }
    if (collection.permissions.read) {
      permissions.read.base = collection.permissions.read.base;
      Object.assign(permissions.read.roles, collection.permissions.read.roles);
    }
    if (collection.permissions.roles) {
      permissions.roles.push(...collection.permissions.roles);
    }
    if (collection.permissions.update) {
      permissions.update.base = collection.permissions.update.base;
      Object.assign(permissions.update.roles, collection.permissions.update.roles);
    }

    return new MongoosePermissions<RecordDocument>(Model, permissions);
  }
}

export type RecordDocument = DocumentType<RecordSchema>;
export type RecordModel = ReturnModelType<typeof RecordSchema>;

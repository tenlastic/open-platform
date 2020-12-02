import {
  DocumentType,
  Ref,
  ReturnModelType,
  buildSchema,
  modelOptions,
  plugin,
  prop,
} from '@hasezoey/typegoose';
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

export const RecordEvent = new EventEmitter<IDatabasePayload<RecordDocument>>();

// Send changes to Kafka.
RecordEvent.on(payload => {
  kafka.publish(payload);
});

@modelOptions({
  schemaOptions: {
    minimize: false,
    timestamps: true,
  },
})
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: RecordEvent })
@plugin(uniqueErrorPlugin)
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
    const schema = buildSchema(RecordSchema).clone();
    schema.add({ properties: jsonSchema.toMongoose(collection.jsonSchema) });
    schema.set('collection', collection.collectionName);

    // Register indexes with Mongoose.
    collection.indexes.forEach(i => schema.index(i.key, i.options));

    // Remove cached Model from Mongoose.
    try {
      mongoose.connection.deleteModel(collection.collectionName);
    } catch {}

    return mongoose.model(collection.collectionName, schema) as RecordModel;
  }

  public static getPermissions(Model: RecordModel, collection: CollectionDocument) {
    const permissions = JSON.parse(JSON.stringify(RecordPermissions)) as IOptions;

    Object.assign(permissions.create, collection.permissions.create);
    Object.assign(permissions.delete, collection.permissions.delete);
    Object.assign(permissions.read, collection.permissions.read);
    Object.assign(permissions.update, collection.permissions.update);

    if (collection.permissions.find) {
      const find = JSON.parse(JSON.stringify(collection.permissions.find));
      if (find.default) {
        find.default = { $or: [permissions.find.default, find.default] };
      }
      Object.assign(permissions.find, find);
    }
    if (collection.permissions.populate) {
      permissions.populate.push(...collection.permissions.populate);
    }
    if (collection.permissions.roles) {
      permissions.roles.push(...collection.permissions.roles);
    }

    return new MongoosePermissions<RecordDocument>(Model, permissions);
  }
}

export type RecordDocument = DocumentType<RecordSchema>;
export type RecordModel = ReturnModelType<typeof RecordSchema>;

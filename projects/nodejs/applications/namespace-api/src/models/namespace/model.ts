import {
  EventEmitter,
  IDatabasePayload,
  changeStreamPlugin,
} from '@tenlastic/mongoose-change-stream';
import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import * as mongoose from 'mongoose';
import { InstanceType, ModelType, Typegoose, arrayProp, index, plugin, prop } from 'typegoose';

import { UserRolesDocument, UserRolesSchema } from '../user-roles';

export const NamespaceEvent = new EventEmitter<IDatabasePayload<NamespaceDocument>>();
NamespaceEvent.on(kafka.publish);

@index({ name: 1 }, { unique: true })
@plugin(changeStreamPlugin, {
  documentKeys: ['_id'],
  eventEmitter: NamespaceEvent,
})
export class NamespaceSchema extends Typegoose {
  public _id: mongoose.Types.ObjectId;

  @arrayProp({ default: [], items: UserRolesSchema })
  public accessControlList: UserRolesDocument[];

  public createdAt: Date;

  @prop({ match: /^[0-9a-z\-]{6,40}$/, required: true })
  public name: string;

  public updatedAt: Date;
}

export type NamespaceDocument = InstanceType<NamespaceSchema>;
export type NamespaceModel = ModelType<NamespaceSchema>;
export const Namespace = new NamespaceSchema().getModelForClass(NamespaceSchema, {
  schemaOptions: {
    autoIndex: false,
    collection: 'namespaces',
    minimize: false,
    timestamps: true,
  },
});

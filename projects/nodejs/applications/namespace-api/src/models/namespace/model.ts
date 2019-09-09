import {
  DocumentType,
  ReturnModelType,
  arrayProp,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  prop,
} from '@hasezoey/typegoose';
import {
  EventEmitter,
  IDatabasePayload,
  changeStreamPlugin,
} from '@tenlastic/mongoose-change-stream';
import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import { plugin as uniqueErrorPlugin } from '@tenlastic/mongoose-unique-error';
import * as mongoose from 'mongoose';

import { UserRolesDocument, UserRoles } from './user-roles';

export const NamespaceEvent = new EventEmitter<IDatabasePayload<NamespaceDocument>>();
NamespaceEvent.on(kafka.publish);

@index({ name: 1 }, { unique: true })
@modelOptions({
  schemaOptions: {
    autoIndex: false,
    collection: 'namespaces',
    minimize: false,
    timestamps: true,
  },
})
@plugin(changeStreamPlugin, {
  documentKeys: ['_id'],
  eventEmitter: NamespaceEvent,
})
@plugin(uniqueErrorPlugin)
export class NamespaceSchema {
  public _id: mongoose.Types.ObjectId;

  @arrayProp({ default: [], items: UserRoles })
  public accessControlList: UserRolesDocument[];

  public createdAt: Date;

  @prop({ match: /^[0-9a-z\-]{6,40}$/, required: true })
  public name: string;

  public updatedAt: Date;
}

export type NamespaceDocument = DocumentType<NamespaceSchema>;
export type NamespaceModel = ReturnModelType<typeof NamespaceSchema>;
export const Namespace = getModelForClass(NamespaceSchema);

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

import { ReadonlyUserDocument } from '../readonly-user';
import { UserRolesDocument, UserRoles } from './user-roles';

export const NamespaceEvent = new EventEmitter<IDatabasePayload<NamespaceDocument>>();
NamespaceEvent.on(kafka.publish);

@index({ name: 1 }, { unique: true })
@index({ 'accessControlList.roles': 1 })
@index({ 'accessControlList.userIds': 1 })
@modelOptions({
  schemaOptions: {
    autoIndex: true,
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

  @prop({ match: /^[0-9a-z\-]{2,40}$/, required: true })
  public name: string;

  public updatedAt: Date;

  public static getDefaultAccessControlList(
    accessControlList: Array<Partial<UserRolesDocument>>,
    user: Partial<ReadonlyUserDocument>,
  ) {
    const copy = accessControlList ? accessControlList.concat() : [];

    if (copy.length === 0) {
      const userRoles = new UserRoles({ roles: ['Administrator'], userId: user._id });
      copy.push(userRoles);

      return copy;
    }

    if (copy.find(acl => acl.roles.includes('Administrator'))) {
      return copy;
    }

    const result = copy.find(acl => acl.userId.toString() === user._id.toString());
    if (result) {
      result.roles.push('Administrator');
    } else {
      const userRoles = new UserRoles({ roles: ['Administrator'], userId: user._id });
      copy.push(userRoles);
    }

    return copy;
  }
}

export type NamespaceDocument = DocumentType<NamespaceSchema>;
export type NamespaceModel = ReturnModelType<typeof NamespaceSchema>;
export const Namespace = getModelForClass(NamespaceSchema);

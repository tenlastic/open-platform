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

import { UserDocument } from '../user';
import { NamespaceKey, NamespaceKeyDocument } from './key';
import { NamespaceLimitsDocument } from './limits';
import { NamespaceUser, NamespaceUserDocument } from './user';

export const NamespaceEvent = new EventEmitter<IDatabasePayload<NamespaceDocument>>();
NamespaceEvent.on(payload => {
  kafka.publish(payload);
});

export class NamespaceLimitError extends Error {
  public path: string;

  constructor(path: string) {
    super(`Namespace limit reached: ${path}.`);

    this.path = path;
  }
}

export enum NamespaceRole {
  Articles = 'articles',
  Builds = 'builds',
  Collections = 'collections',
  GameServers = 'game-servers',
  GameInvitations = 'game-invitations',
  Games = 'games',
  Namespaces = 'namespaces',
  Queues = 'queues',
}

@index({ name: 1 }, { unique: true })
@index({ 'keys.roles': 1 })
@index({ 'keys.value': 1 })
@index({ 'users._id': 1 })
@index({ 'users.roles': 1 })
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

  public createdAt: Date;

  @arrayProp({ default: [], items: NamespaceKey })
  public keys: NamespaceKeyDocument[];

  @prop({ required: true })
  public limits: NamespaceLimitsDocument;

  @prop({ required: true })
  public name: string;

  public updatedAt: Date;

  @arrayProp({ default: [], items: NamespaceUser })
  public users: NamespaceUserDocument[];

  public static getDefaultUsers(
    users: Array<Partial<NamespaceUserDocument>>,
    user: Partial<UserDocument>,
  ) {
    const copy = users ? users.concat() : [];

    if (copy.length === 0) {
      const namespaceUser = new NamespaceUser({
        _id: user._id,
        roles: [NamespaceRole.Namespaces],
      });
      copy.push(namespaceUser);

      return copy;
    }

    if (copy.find(u => u.roles.includes(NamespaceRole.Namespaces))) {
      return copy;
    }

    const result = copy.find(u => u._id.toString() === user._id.toString());
    if (result) {
      result.roles.push(NamespaceRole.Namespaces);
    } else {
      const namespaceUser = new NamespaceUser({
        _id: user._id,
        roles: [NamespaceRole.Namespaces],
      });
      copy.push(namespaceUser);
    }

    return copy;
  }
}

export type NamespaceDocument = DocumentType<NamespaceSchema>;
export type NamespaceModel = ReturnModelType<typeof NamespaceSchema>;
export const Namespace = getModelForClass(NamespaceSchema);

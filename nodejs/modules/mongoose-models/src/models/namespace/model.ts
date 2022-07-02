import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  prop,
} from '@typegoose/typegoose';
import * as jwt from 'jsonwebtoken';
import * as mongoose from 'mongoose';

import { EventEmitter, IDatabasePayload, changeStreamPlugin } from '../../change-stream';
import * as errors from '../../errors';
import { UserDocument } from '../user';
import { NamespaceKeySchema } from './key';
import {
  NamespaceBuildLimits,
  NamespaceGameLimits,
  NamespaceGameServerLimits,
  NamespaceLimits,
  NamespaceLimitsSchema,
  NamespaceQueueLimits,
  NamespaceWorkflowLimits,
} from './limits';
import { NamespaceUser, NamespaceUserDocument, NamespaceUserSchema } from './user';

export class NamespaceLimitError extends Error {
  public path: string;
  public value: any;

  constructor(path: string, value: any) {
    super(`Namespace limit reached: ${path}. Value: ${value}.`);

    this.name = 'NamespaceLimitError';
    this.path = path;
    this.value = value;
  }
}

export const NamespaceEvent = new EventEmitter<IDatabasePayload<NamespaceDocument>>();

export enum NamespaceRole {
  Articles = 'articles',
  Authorizations = 'authorizations',
  Builds = 'builds',
  Collections = 'collections',
  GameServers = 'game-servers',
  Games = 'games',
  Namespaces = 'namespaces',
  Queues = 'queues',
  Workflows = 'workflows',
}

@index(
  { 'keys.value': 1 },
  {
    partialFilterExpression: {
      'keys.value': { $type: 'string' },
    },
    unique: true,
  },
)
@index({ name: 1 }, { unique: true })
@index({ 'keys.roles': 1 })
@index({ 'users._id': 1 })
@index({ 'users.roles': 1 })
@modelOptions({
  schemaOptions: {
    collection: 'namespaces',
    minimize: false,
    timestamps: true,
  },
})
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: NamespaceEvent })
@plugin(errors.unique.plugin)
export class NamespaceSchema {
  public _id: mongoose.Types.ObjectId;

  public createdAt: Date;

  @prop({ type: NamespaceKeySchema })
  public keys: NamespaceKeySchema[];

  @prop({
    default: new NamespaceLimits({
      builds: new NamespaceBuildLimits(),
      gameServers: new NamespaceGameServerLimits(),
      games: new NamespaceGameLimits(),
      queues: new NamespaceQueueLimits(),
      workflows: new NamespaceWorkflowLimits(),
    }),
  })
  public limits: NamespaceLimitsSchema;

  @prop({ required: true })
  public name: string;

  public updatedAt: Date;

  @prop({ type: NamespaceUserSchema })
  public users: NamespaceUserSchema[];

  public _original: any;
  public wasModified: string[];
  public wasNew: boolean;

  /**
   * Creates an access token that does not expire.
   */
  public static getAccessToken(
    namespaceId: string | mongoose.Types.ObjectId,
    roles: NamespaceRole[],
  ) {
    return jwt.sign(
      { type: 'access', user: { namespaceId, roles } },
      process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n'),
      { algorithm: 'RS256' },
    );
  }

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

    if (copy.find((u) => u.roles.includes(NamespaceRole.Namespaces))) {
      return copy;
    }

    const result = copy.find((u) => u._id.toString() === user._id.toString());
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

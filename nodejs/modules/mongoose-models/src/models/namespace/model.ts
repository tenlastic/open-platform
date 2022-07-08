import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  prop,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

import { EventEmitter, IDatabasePayload, changeStreamPlugin } from '../../change-stream';
import * as errors from '../../errors';
import { AuthorizationDocument } from '../authorization/model';
import {
  NamespaceBuildLimits,
  NamespaceGameLimits,
  NamespaceGameServerLimits,
  NamespaceLimits,
  NamespaceLimitsSchema,
  NamespaceQueueLimits,
  NamespaceWorkflowLimits,
} from './limits';

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

@index({ name: 1 }, { unique: true })
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

  @prop({ foreignField: 'namespaceId', localField: '_id', ref: 'AuthorizationSchema' })
  public authorizationDocuments: AuthorizationDocument;

  public _original: any;
  public wasModified: string[];
  public wasNew: boolean;
}

export type NamespaceDocument = DocumentType<NamespaceSchema>;
export type NamespaceModel = ReturnModelType<typeof NamespaceSchema>;
export const Namespace = getModelForClass(NamespaceSchema);

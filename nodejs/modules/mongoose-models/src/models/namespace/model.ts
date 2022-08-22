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

import { changeStreamPlugin, EventEmitter, IDatabasePayload } from '../../change-stream';
import * as errors from '../../errors';
import { AuthorizationDocument } from '../authorization/model';
import {
  NamespaceBuildLimits,
  NamespaceGameServerLimits,
  NamespaceLimits,
  NamespaceLimitsSchema,
  NamespaceQueueLimits,
  NamespaceStorefrontLimits,
  NamespaceWorkflowLimits,
} from './limits';

export const OnNamespaceProduced = new EventEmitter<IDatabasePayload<NamespaceDocument>>();

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

@index({ name: 1 }, { unique: true })
@modelOptions({ schemaOptions: { collection: 'namespaces', minimize: false, timestamps: true } })
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: OnNamespaceProduced })
@plugin(errors.unique.plugin)
export class NamespaceSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({
    default: new NamespaceLimits({
      builds: new NamespaceBuildLimits(),
      gameServers: new NamespaceGameServerLimits(),
      queues: new NamespaceQueueLimits(),
      storefronts: new NamespaceStorefrontLimits(),
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

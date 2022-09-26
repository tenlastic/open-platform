import {
  changeStreamPlugin,
  errors,
  EventEmitter,
  IDatabasePayload,
} from '@tenlastic/mongoose-models';
import {
  DocumentType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  pre,
  prop,
  ReturnModelType,
  Severity,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

import { AuthorizationDocument } from '../authorization/model';
import { NamespaceLimits, NamespaceLimitsSchema } from './limits';
import {
  NamespaceStatusComponent,
  NamespaceStatusComponentName,
  NamespaceStatusPhase,
  NamespaceStatusSchema,
} from './status';

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
@modelOptions({
  options: { allowMixed: Severity.ALLOW },
  schemaOptions: { collection: 'namespaces', minimize: false, timestamps: true },
})
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: OnNamespaceProduced })
@plugin(errors.unique.plugin)
@pre('save', async function (this: NamespaceDocument) {
  if (!this.isNew) {
    return;
  }

  this.status.components = [
    new NamespaceStatusComponent({
      current: 0,
      name: NamespaceStatusComponentName.Api,
      phase: NamespaceStatusPhase.Pending,
      total: 1,
    }),
    new NamespaceStatusComponent({
      current: 0,
      name: NamespaceStatusComponentName.Sidecar,
      phase: NamespaceStatusPhase.Pending,
      total: 1,
    }),
  ];
})
export class NamespaceSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ default: new NamespaceLimits() })
  public limits: NamespaceLimitsSchema;

  @prop({ required: true })
  public name: string;

  @prop({ default: { phase: 'Pending' } })
  public status: NamespaceStatusSchema;

  public updatedAt: Date;

  @prop({ foreignField: 'namespaceId', localField: '_id', ref: 'AuthorizationSchema' })
  public authorizationDocuments: AuthorizationDocument[];

  public _original: any;
  public wasModified: string[];
  public wasNew: boolean;
}

export type NamespaceDocument = DocumentType<NamespaceSchema>;
export type NamespaceModel = ReturnModelType<typeof NamespaceSchema>;
export const Namespace = getModelForClass(NamespaceSchema);

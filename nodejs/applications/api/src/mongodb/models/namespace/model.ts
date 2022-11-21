import { duplicateKeyErrorPlugin } from '@tenlastic/mongoose-models';
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

export class NamespaceLimitError extends Error {
  public path: string;

  constructor(path: string) {
    super(`Namespace limit reached: ${path}.`);

    this.name = 'NamespaceLimitError';
    this.path = path;
  }
}

@index({ name: 1 }, { unique: true })
@modelOptions({
  options: { allowMixed: Severity.ALLOW },
  schemaOptions: { collection: 'namespaces', minimize: false, timestamps: true },
})
@plugin(duplicateKeyErrorPlugin)
@pre('save', async function (this: NamespaceDocument) {
  if (!this.isNew) {
    return;
  }

  this.status.components = [
    new NamespaceStatusComponent({
      current: 0,
      name: NamespaceStatusComponentName.API,
      phase: NamespaceStatusPhase.Pending,
      total: 1,
    }),
    new NamespaceStatusComponent({
      current: 0,
      name: NamespaceStatusComponentName.CDC,
      phase: NamespaceStatusPhase.Pending,
      total: 1,
    }),
    new NamespaceStatusComponent({
      current: 0,
      name: NamespaceStatusComponentName.Connector,
      phase: NamespaceStatusPhase.Pending,
      total: 1,
    }),
    new NamespaceStatusComponent({
      current: 0,
      name: NamespaceStatusComponentName.Metrics,
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

  @prop({ default: new NamespaceLimits(), type: NamespaceLimitsSchema })
  public limits: NamespaceLimitsSchema;

  @prop({ required: true, type: String })
  public name: string;

  @prop({ default: { phase: 'Pending' }, merge: true, type: NamespaceStatusSchema })
  public status: NamespaceStatusSchema;

  public updatedAt: Date;

  @prop({ foreignField: 'namespaceId', localField: '_id', ref: 'AuthorizationSchema' })
  public authorizationDocuments: AuthorizationDocument[];

  public checkDefaultAuthorizationLimit(current: boolean) {
    if (current && !this.limits?.defaultAuthorization) {
      throw new NamespaceLimitError('defaultAuthorization');
    }
  }
}

export type NamespaceDocument = DocumentType<NamespaceSchema>;
export type NamespaceModel = ReturnModelType<typeof NamespaceSchema>;
export const Namespace = getModelForClass(NamespaceSchema);

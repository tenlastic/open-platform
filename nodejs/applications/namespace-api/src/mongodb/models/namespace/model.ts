import {
  DocumentType,
  getModelForClass,
  index,
  modelOptions,
  prop,
  ReturnModelType,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

import { AuthorizationDocument } from '../authorization/model';

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

@index({ name: 1 })
@modelOptions({ schemaOptions: { collection: 'namespaces', minimize: false, timestamps: true } })
export class NamespaceSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;
  public updatedAt: Date;

  @prop({ foreignField: 'namespaceId', localField: '_id', ref: 'AuthorizationSchema' })
  public authorizationDocuments: AuthorizationDocument[];
}

export type NamespaceDocument = DocumentType<NamespaceSchema>;
export type NamespaceModel = ReturnModelType<typeof NamespaceSchema>;
export const Namespace = getModelForClass(NamespaceSchema);

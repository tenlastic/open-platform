import {
  DocumentType,
  getModelForClass,
  index,
  modelOptions,
  prop,
  PropType,
  ReturnModelType,
  Severity,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

import { AuthorizationDocument } from '../authorization';

@index({ namespaceId: 1 })
@index({ subtitle: 1, title: 1 })
@modelOptions({
  options: { allowMixed: Severity.ALLOW },
  schemaOptions: { collection: 'storefronts', minimize: false, timestamps: true },
})
export class StorefrontSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ type: String })
  public background: string;

  public createdAt: Date;

  @prop({ type: String })
  public description: string;

  @prop({ type: String })
  public icon: string;

  @prop({ type: String }, PropType.ARRAY)
  public images: string[];

  @prop({ type: String })
  public logo: string;

  @prop({ type: mongoose.Schema.Types.Mixed })
  public metadata: any;

  @prop({ ref: 'NamespaceSchema', type: mongoose.Schema.Types.ObjectId })
  public namespaceId: mongoose.Types.ObjectId;

  @prop({ match: /^.{2,40}$/, type: String })
  public subtitle: string;

  @prop({ match: /^.{2,40}$/, type: String })
  public title: string;

  public updatedAt: Date;

  @prop({ type: String }, PropType.ARRAY)
  public videos: string[];

  @prop({ foreignField: 'namespaceId', localField: 'namespaceId', ref: 'AuthorizationSchema' })
  public authorizationDocuments: AuthorizationDocument[];
}

export type StorefrontDocument = DocumentType<StorefrontSchema>;
export type StorefrontModel = ReturnModelType<typeof StorefrontSchema>;
export const Storefront = getModelForClass(StorefrontSchema);

import {
  DocumentType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  prop,
  PropType,
  ReturnModelType,
  Severity,
} from '@typegoose/typegoose';
import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { duplicateKeyErrorPlugin, unsetPlugin } from '../../plugins';
import { AuthorizationDocument } from '../authorization';

@index({ namespaceId: 1 }, { unique: true })
@index({ subtitle: 1, title: 1 }, { collation: { locale: 'en_US', strength: 1 }, unique: true })
@modelOptions({
  options: { allowMixed: Severity.ALLOW },
  schemaOptions: { collection: 'storefronts', timestamps: true },
})
@plugin(duplicateKeyErrorPlugin)
@plugin(unsetPlugin)
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

  @prop({ type: mongoose.Schema.Types.Mixed, unset: false })
  public metadata: any;

  @prop({ ref: 'NamespaceSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public namespaceId: mongoose.Types.ObjectId;

  @prop({ match: /^.{2,40}$/, type: String })
  public subtitle: string;

  @prop({ match: /^.{2,40}$/, required: true, type: String })
  public title: string;

  public updatedAt: Date;

  @prop({ type: String }, PropType.ARRAY)
  public videos: string[];

  @prop({ foreignField: 'namespaceId', localField: 'namespaceId', ref: 'AuthorizationSchema' })
  public authorizationDocuments: AuthorizationDocument[];

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(this: StorefrontModel, values: Partial<StorefrontSchema> = {}) {
    const chance = new Chance();
    const defaults = {
      namespaceId: new mongoose.Types.ObjectId(),
      title: chance.hash(),
    };

    return new this({ ...defaults, ...values });
  }
}

export type StorefrontDocument = DocumentType<StorefrontSchema>;
export type StorefrontModel = ReturnModelType<typeof StorefrontSchema>;
export const Storefront = getModelForClass(StorefrontSchema);
